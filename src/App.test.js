import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/VehicleModel/VehicleModel', () => ({ VehicleModel: () => null }));
jest.mock('./components/MapNavigation/MapNavigation', () => ({ MapNavigation: () => null }));
jest.mock('./components/MusicPanel/MusicPanel', () => ({ MusicPanel: () => null }));
jest.mock('./components/ErrorScreen/ErrorScreen', () => () => null);
jest.mock('react-resizable-panels', () => {
  const React = require('react');
  return {
    PanelGroup: ({ children }) => <div>{children}</div>,
    PanelResizeHandle: () => null,
    Panel: React.forwardRef(({ children }, ref) => {
      React.useImperativeHandle(ref, () => ({ getSize: () => 40, resize() {} }), []);
      return <div>{children}</div>;
    }),
  };
});

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('failed or stalled external images cannot leave the loader or a polling timer running', () => {
  jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
  const view = render(<App />);
  expect(screen.getByAltText('Tesla Logo')).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(15000));
  expect(screen.queryByAltText('Tesla Logo')).not.toBeInTheDocument();
  expect(view.container.querySelector('#displayBezel')).toHaveStyle({ display: 'block' });
  expect(jest.getTimerCount()).toBe(0);
  fireEvent.click(screen.getByAltText('saved-routes icon'));
  expect(screen.getByText('No saved routes yet.')).toBeInTheDocument();
});

test('loader completion and early unmount clear all loader timers', () => {
  jest.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
  const first = render(<App />);
  act(() => jest.advanceTimersByTime(3000));
  expect(screen.queryByAltText('Tesla Logo')).not.toBeInTheDocument();
  expect(jest.getTimerCount()).toBe(0);
  first.unmount();
  const second = render(<App />);
  second.unmount();
  expect(jest.getTimerCount()).toBe(0);
});
