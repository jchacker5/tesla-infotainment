import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const SavedRoutesContext = createContext();

const STORAGE_KEY = 'tesla-saved-routes';

export const SavedRoutesProvider = ({ children }) => {
  const [savedRoutes, setSavedRoutes] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedRoutes));
  }, [savedRoutes]);

  const saveRoute = useCallback((route) => {
    const newRoute = {
      id: Date.now().toString(),
      name: route.name,
      destination: route.destination,
      createdAt: new Date().toISOString(),
    };
    setSavedRoutes(prev => [newRoute, ...prev]);
  }, []);

  const deleteRoute = useCallback((id) => {
    setSavedRoutes(prev => prev.filter(r => r.id !== id));
  }, []);

  const selectRoute = useCallback((route) => {
    setSelectedRoute(route);
  }, []);

  const clearSelectedRoute = useCallback(() => {
    setSelectedRoute(null);
  }, []);

  return (
    <SavedRoutesContext.Provider value={{
      savedRoutes,
      selectedRoute,
      saveRoute,
      deleteRoute,
      selectRoute,
      clearSelectedRoute,
    }}>
      {children}
    </SavedRoutesContext.Provider>
  );
};

export const useSavedRoutes = () => useContext(SavedRoutesContext);
