import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const SavedRoutesContext = createContext();
export const STORAGE_KEY = 'tesla-saved-routes';
let nextId = 0;

export const isDestination = (destination) => (
  destination !== null && typeof destination === 'object' &&
  Number.isFinite(destination.lat) && Math.abs(destination.lat) <= 90 &&
  Number.isFinite(destination.lng) && Math.abs(destination.lng) <= 180 &&
  typeof destination.address === 'string' && destination.address.trim().length > 0
);

// Older versions stored the same array without validating its shape.
export const parseSavedRoutes = (stored) => {
  try {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    const ids = new Set();
    return parsed.filter(route => {
      if (!route || typeof route.id !== 'string' || !route.id || ids.has(route.id) ||
          typeof route.name !== 'string' || !route.name.trim() ||
          typeof route.createdAt !== 'string' || !Number.isFinite(Date.parse(route.createdAt)) ||
          !isDestination(route.destination)) return false;
      ids.add(route.id);
      return true;
    }).map(route => ({
      id: route.id,
      name: route.name.trim(),
      destination: { lat: route.destination.lat, lng: route.destination.lng, address: route.destination.address.trim() },
      createdAt: route.createdAt,
    }));
  } catch {
    return [];
  }
};

export const SavedRoutesProvider = ({ children }) => {
  const [savedRoutes, setSavedRoutes] = useState(() => {
    try {
      return parseSavedRoutes(localStorage.getItem(STORAGE_KEY));
    } catch {
      return [];
    }
  });
  const [storageError, setStorageError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes));
      setStorageError('');
    } catch {
      setStorageError('Browser storage is unavailable. Changes will last only for this session.');
    }
  }, [savedRoutes]);

  useEffect(() => {
    const syncRoutes = (event) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setSavedRoutes(parseSavedRoutes(event.newValue));
      }
    };
    window.addEventListener('storage', syncRoutes);
    return () => window.removeEventListener('storage', syncRoutes);
  }, []);

  const saveRoute = useCallback((route) => {
    if (!route || typeof route.name !== 'string' || !route.name.trim() || !isDestination(route.destination)) {
      return false;
    }
    const id = typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `${Date.now()}-${++nextId}-${Math.random().toString(36).slice(2)}`;
    const newRoute = {
      id,
      name: route.name.trim(),
      destination: { ...route.destination, address: route.destination.address.trim() },
      createdAt: new Date().toISOString(),
    };
    setSavedRoutes(prev => [newRoute, ...prev]);
    return true;
  }, []);

  const renameRoute = useCallback((id, name) => {
    if (typeof name !== 'string' || !name.trim()) return false;
    setSavedRoutes(prev => prev.map(route => route.id === id ? { ...route, name: name.trim() } : route));
    return true;
  }, []);

  const deleteRoute = useCallback((id) => {
    setSavedRoutes(prev => prev.filter(route => route.id !== id));
    setSelectedRoute(prev => prev?.id === id ? null : prev);
  }, []);

  const selectRoute = useCallback((route) => {
    if (route && isDestination(route.destination)) setSelectedRoute(route);
  }, []);

  const clearSelectedRoute = useCallback(() => setSelectedRoute(null), []);

  return (
    <SavedRoutesContext.Provider value={{
      savedRoutes, selectedRoute, storageError, saveRoute, renameRoute,
      deleteRoute, selectRoute, clearSelectedRoute,
    }}>
      {children}
    </SavedRoutesContext.Provider>
  );
};

export const useSavedRoutes = () => useContext(SavedRoutesContext);
