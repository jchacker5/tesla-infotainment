import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapNavigation } from './MapNavigation';
import { SavedRoutesProvider, useSavedRoutes } from '../../contexts/SavedRoutesContext';

let mockPlaceChanged;
let mockPlace;
let mockRequests;
let mockTraffic;
const mockMap = { panTo: jest.fn(), setZoom: jest.fn(), setHeading: jest.fn() };

jest.mock('../CarLock/CarLock', () => () => null);
jest.mock('../Clock/Clock', () => () => null);
jest.mock('../OutsideTemp/OutsideTemp', () => () => null);
jest.mock('../UserProfile/UserProfile', () => () => null);
jest.mock('@react-google-maps/api', () => {
  const React = require('react');
  return {
    useJsApiLoader: jest.fn(() => ({ isLoaded: true })),
    GoogleMap: ({ children, onLoad, onUnmount }) => {
      React.useEffect(() => { onLoad(mockMap); return () => onUnmount(mockMap); }, [onLoad, onUnmount]);
      return <div>{children}</div>;
    },
    Autocomplete: ({ children, onLoad, onPlaceChanged }) => {
      mockPlaceChanged = onPlaceChanged;
      React.useEffect(() => { onLoad({ getPlace: () => mockPlace }); }, []);
      return children;
    },
    Marker: () => null,
    DirectionsRenderer: ({ directions }) => <div data-testid="route">{directions.id}</div>,
    TrafficLayer: () => {
      React.useEffect(() => {
        const layer = new globalThis.google.maps.TrafficLayer();
        layer.setMap(mockMap);
        return () => layer.setMap(null);
      }, []);
      return null;
    },
  };
});

const destination = (address, lat = 42) => ({ lat, lng: -71, address });
function SavedRouteButtons() {
  const { selectRoute } = useSavedRoutes();
  return <>
    <button onClick={() => selectRoute({ name: 'First saved', destination: destination('First address') })}>Select first</button>
    <button onClick={() => selectRoute({ name: 'Second saved', destination: destination('Second address', 43) })}>Select second</button>
  </>;
}
function renderMap() {
  return render(<SavedRoutesProvider><MapNavigation /><SavedRouteButtons /></SavedRoutesProvider>);
}
function choosePlace(address = 'Boston, MA', lat = 42) {
  mockPlace = { name: 'A place', formatted_address: address, geometry: { location: { lat: () => lat, lng: () => -71 } } };
  act(() => mockPlaceChanged());
}
function finishRoute(index, id, status = 'OK') {
  act(() => mockRequests[index].callback({ id }, status));
}

beforeEach(() => {
  localStorage.clear();
  mockRequests = [];
  mockTraffic = [];
  useJsApiLoader.mockReturnValue({ isLoaded: true });
  window.google = { maps: {
    Size: function () {},
    DirectionsService: function () { this.route = (request, callback) => mockRequests.push({ request, callback }); },
    DirectionsStatus: { OK: 'OK' },
    TravelMode: { DRIVING: 'DRIVING' },
    TrafficLayer: function () { this.setMap = jest.fn(); mockTraffic.push(this); },
  } };
});

test('selecting a destination, navigating and saving stores its address and coordinates', () => {
  renderMap();
  choosePlace();
  fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
  expect(mockRequests[0].request.destination).toEqual({ lat: 42, lng: -71 });
  finishRoute(0, 'Boston route');
  fireEvent.click(screen.getByRole('button', { name: 'Save Save Route' }));
  fireEvent.change(screen.getByPlaceholderText('Route name...'), { target: { value: 'Work' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(JSON.parse(localStorage.getItem('tesla-saved-routes'))[0]).toMatchObject({ name: 'Work', destination: destination('Boston, MA') });
});

test('clear and edit reset navigation and close the save dialog without a null dereference', () => {
  renderMap();
  choosePlace();
  fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
  finishRoute(0, 'route');
  fireEvent.click(screen.getByRole('button', { name: 'Save Save Route' }));
  fireEvent.click(screen.getByRole('button', { name: 'Clear input' }));
  expect(screen.queryByRole('button', { name: 'End Navigation' })).not.toBeInTheDocument();
  expect(screen.queryByPlaceholderText('Route name...')).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Navigate')).toHaveValue('');
  choosePlace();
  fireEvent.change(screen.getByPlaceholderText('Navigate'), { target: { value: 'unselected query' } });
  expect(screen.queryByRole('button', { name: 'Navigate' })).not.toBeInTheDocument();
});

test('the most recently selected saved destination wins when responses arrive out of order', () => {
  renderMap();
  fireEvent.click(screen.getByRole('button', { name: 'Select first' }));
  fireEvent.click(screen.getByRole('button', { name: 'Select second' }));
  finishRoute(1, 'second route');
  finishRoute(0, 'stale first route');
  expect(screen.getByTestId('route')).toHaveTextContent('second route');
  expect(screen.getByPlaceholderText('Navigate')).toHaveValue('Second address');
  fireEvent.click(screen.getByRole('button', { name: 'Save Save Route' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save', exact: true }));
  expect(JSON.parse(localStorage.getItem('tesla-saved-routes'))[0].destination).toEqual(destination('Second address', 43));
});

test('cancel invalidates a pending response and resets all visible route state', () => {
  renderMap();
  choosePlace();
  fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel Navigation' }));
  finishRoute(0, 'cancelled route');
  expect(screen.queryByTestId('route')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'End Navigation' })).not.toBeInTheDocument();
  expect(screen.getByPlaceholderText('Navigate')).toHaveValue('');
});

test('failed directions show an actionable error and allow retry', () => {
  renderMap();
  choosePlace();
  fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
  finishRoute(0, 'none', 'ZERO_RESULTS');
  expect(screen.getByRole('alert')).toHaveTextContent('No driving route found');
  fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
  expect(mockRequests).toHaveLength(2);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('traffic creates only one layer, detaches on satellite and unmount, and can be toggled off', () => {
  const view = renderMap();
  fireEvent.click(screen.getByRole('button', { name: 'Toggle Traffic' }));
  expect(mockTraffic).toHaveLength(1);
  expect(mockTraffic[0].setMap).toHaveBeenLastCalledWith(mockMap);
  fireEvent.click(screen.getByRole('button', { name: 'Map Style' }));
  expect(mockTraffic[0].setMap).toHaveBeenLastCalledWith(null);
  fireEvent.click(screen.getByRole('button', { name: 'Map Style' }));
  expect(mockTraffic).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Toggle Traffic' }));
  expect(mockTraffic[1].setMap).toHaveBeenLastCalledWith(null);
  fireEvent.click(screen.getByRole('button', { name: 'Toggle Traffic' }));
  view.unmount();
  expect(mockTraffic[2].setMap).toHaveBeenLastCalledWith(null);
});

test('a maps loader error is visible instead of leaving a blank map', () => {
  useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: new Error('offline') });
  renderMap();
  expect(screen.getByRole('alert')).toHaveTextContent('map could not be loaded');
});
