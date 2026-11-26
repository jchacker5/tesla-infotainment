import React, { useState } from 'react';
import { useSavedRoutes } from '../../../contexts/SavedRoutesContext';
import { getImagePath } from '../../../utils/assetPaths';
import './SavedRoutes.css';

export const SavedRoutes = () => {
  const { savedRoutes, storageError, deleteRoute, renameRoute, selectRoute } = useSavedRoutes();
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState('');

  const submitRename = (event, id) => {
    event.preventDefault();
    if (renameRoute(id, name)) setEditingId(null);
  };

  const handleNavigate = (route) => {
    selectRoute(route);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    deleteRoute(id);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (savedRoutes.length === 0) {
    return (
      <div className="saved-routes">
        <div className="saved-routes-header">
          <img src={getImagePath("icon-settings-navigation.svg")} alt="Navigation" className="saved-routes-header-icon" />
          <h2>Saved Routes</h2>
        </div>
        {storageError && <p role="alert">{storageError}</p>}
        <div className="saved-routes-empty">
          <p>No saved routes yet.</p>
          <p className="saved-routes-empty-hint">
            Navigate to a destination, then tap the save button to pin your favorite routes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-routes">
      <div className="saved-routes-header">
        <img src={getImagePath("icon-settings-navigation.svg")} alt="Navigation" className="saved-routes-header-icon" />
        <h2>Saved Routes</h2>
        <span className="saved-routes-count">{savedRoutes.length}</span>
      </div>
      {storageError && <p role="alert">{storageError}</p>}
      <div className="saved-routes-list">
        {savedRoutes.map((route) => (
          <div key={route.id} className="saved-route-item">
            <div className="saved-route-info">
              {editingId === route.id ? (
                <form className="saved-route-rename-form" onSubmit={(event) => submitRename(event, route.id)}>
                  <input aria-label="Route name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
                  <button type="submit" disabled={!name.trim()}>Save name</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </form>
              ) : <div className="saved-route-name">{route.name}</div>}
              <div className="saved-route-address">{route.destination.address}</div>
              <div className="saved-route-date">Saved {formatDate(route.createdAt)}</div>
            </div>
            <div className="saved-route-actions">
              <button
                className="saved-route-navigate-btn"
                onClick={() => handleNavigate(route)}
              >
                Navigate
              </button>
              <button
                className="saved-route-rename-btn"
                aria-label={`Rename ${route.name}`}
                onClick={() => { setEditingId(route.id); setName(route.name); }}
              >
                Rename
              </button>
              <button
                aria-label={`Delete ${route.name}`}
                className="saved-route-delete-btn"
                onClick={(e) => handleDelete(e, route.id)}
              >
                <img src={getImagePath("icon-x.svg")} alt="Delete" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
