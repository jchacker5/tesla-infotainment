import React from 'react';
import { useSavedRoutes } from '../../../contexts/SavedRoutesContext';
import { getImagePath } from '../../../utils/assetPaths';
import './SavedRoutes.css';

export const SavedRoutes = () => {
  const { savedRoutes, deleteRoute, selectRoute } = useSavedRoutes();

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
      <div className="saved-routes-list">
        {savedRoutes.map((route) => (
          <div key={route.id} className="saved-route-item">
            <div className="saved-route-info">
              <div className="saved-route-name">{route.name}</div>
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
