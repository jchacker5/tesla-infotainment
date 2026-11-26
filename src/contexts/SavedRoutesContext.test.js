import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { SavedRoutesProvider, STORAGE_KEY, useSavedRoutes, parseSavedRoutes } from './SavedRoutesContext';
import { SavedRoutes } from '../components/Apps/SavedRoutes/SavedRoutes';

const destination = { lat: 42.36, lng: -71.06, address: 'Boston, MA' };
const record = { id: 'old', name: 'Home', destination, createdAt: '2024-01-01T00:00:00.000Z' };
let context;
function Harness() {
  context = useSavedRoutes();
  return <SavedRoutes />;
}
const mount = () => render(<SavedRoutesProvider><Harness /></SavedRoutesProvider>);

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test.each(['null', '{}', '42', '"text"', 'not json', '[null,{},1]'])(
  'corrupt storage %s does not crash the panel', stored => {
    localStorage.setItem(STORAGE_KEY, stored);
    mount();
    expect(screen.getByText('No saved routes yet.')).toBeInTheDocument();
  }
);

test('restores only valid entries and removes duplicate IDs', () => {
  const routes = [record, record, { ...record, id: 'nan', destination: { ...destination, lat: null } },
    { ...record, id: 'range', destination: { ...destination, lng: 181 } },
    { ...record, id: 'date', createdAt: 'invalid' }, { ...record, id: 'name', name: '  ' }];
  expect(parseSavedRoutes(JSON.stringify(routes))).toEqual([record]);
});

test('save, rename, restore and delete preserve destination coordinates and address', () => {
  const first = mount();
  act(() => context.saveRoute({ name: '  Work  ', destination }));
  fireEvent.click(screen.getByRole('button', { name: 'Rename Work' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Route name' }), { target: { value: 'Office' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save name' }));
  const saved = context.savedRoutes[0];
  expect(saved.name).toBe('Office');
  expect(saved.destination).toEqual(destination);
  first.unmount();
  mount();
  expect(screen.getByText('Office')).toBeInTheDocument();
  expect(context.savedRoutes[0]).toEqual(saved);
  fireEvent.click(screen.getByRole('button', { name: 'Navigate' }));
  expect(context.selectedRoute).toEqual(saved);
  fireEvent.click(screen.getByRole('button', { name: 'Delete Office' }));
  expect(context.selectedRoute).toBeNull();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual([]);
});

test('two saves during the same millisecond have independent IDs and deletion', () => {
  jest.spyOn(Date, 'now').mockReturnValue(12345);
  mount();
  act(() => {
    context.saveRoute({ name: 'First', destination });
    context.saveRoute({ name: 'Second', destination });
  });
  expect(new Set(context.savedRoutes.map(route => route.id)).size).toBe(2);
  act(() => context.deleteRoute(context.savedRoutes[0].id));
  expect(context.savedRoutes).toHaveLength(1);
  expect(context.savedRoutes[0].name).toBe('First');
});

test('storage read and write failures keep the panel usable and disclose persistence failure', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  mount();
  act(() => context.saveRoute({ name: 'In memory', destination }));
  expect(screen.getByText('In memory')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent('only for this session');
});

test('invalid destinations and empty names cannot be saved or renamed', () => {
  mount();
  act(() => {
    expect(context.saveRoute({ name: 'Bad', destination: { ...destination, lat: Infinity } })).toBe(false);
    expect(context.saveRoute({ name: ' ', destination })).toBe(false);
    context.saveRoute({ name: 'Good', destination });
  });
  act(() => expect(context.renameRoute(context.savedRoutes[0].id, ' ')).toBe(false));
  expect(context.savedRoutes).toHaveLength(1);
  expect(context.savedRoutes[0].name).toBe('Good');
});

test('storage events synchronize edits and tolerate corrupt values and clear', () => {
  mount();
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify([record]) })));
  expect(screen.getByText('Home')).toBeInTheDocument();
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: '{}' })));
  expect(context.savedRoutes).toEqual([]);
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: JSON.stringify([record]) })));
  act(() => window.dispatchEvent(new StorageEvent('storage', { key: null })));
  expect(context.savedRoutes).toEqual([]);
});
