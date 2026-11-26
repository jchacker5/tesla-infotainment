import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getImagePath } from '../../utils/assetPaths';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete, DirectionsRenderer, TrafficLayer } from '@react-google-maps/api';
import CarLock from '../CarLock/CarLock';
import Clock from '../Clock/Clock';
import OutsideTemp from '../OutsideTemp/OutsideTemp';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import UserProfile from '../UserProfile/UserProfile';
import { useSavedRoutes, isDestination } from '../../contexts/SavedRoutesContext';
import './MapNavigation.css';
import './MapNavigationAutocomplete.css';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const MAP_ID = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || '2d1b7cd2cf277f7';

const libraries = ['places'];

export function MapNavigation({ onWifiClick }) {
  const [center, setCenter] = useState({ lat: 33.9210278, lng: -118.33005555555555 }); // Default location
  const [mapType, setMapType] = useState('roadmap');
  const [showTraffic, setShowTraffic] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [chargers, setChargers] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);
  const mapRef = useRef(null);
  const [markerIcon, setMarkerIcon] = useState(null);
  const [directions, setDirections] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [activeDestination, setActiveDestination] = useState(null);
  const [isRouting, setIsRouting] = useState(false);
  const [navigationError, setNavigationError] = useState('');
  const routeRequestId = useRef(0);
  const isNavigating = activeDestination !== null;
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveRouteName, setSaveRouteName] = useState('');
  const { saveRoute, selectedRoute, clearSelectedRoute, storageError } = useSavedRoutes();

  // Memoize the loader options so it doesn't re-create on every render
  const loaderOptions = useMemo(() => ({
    id: 'google-map-script',
    googleMapsApiKey: API_KEY,
    libraries: libraries,
  }), []);

  const { isLoaded, loadError } = useJsApiLoader(loaderOptions);

  useEffect(() => {
    if (isLoaded && window.google) {
      setMarkerIcon({
        url: getImagePath("icon-car-marker.svg"),
        scaledSize: new window.google.maps.Size(40, 40)
      });
      setDirectionsService(new window.google.maps.DirectionsService());
    }
  }, [isLoaded]);

  const cancelRoute = useCallback(() => {
    // Google Maps requests cannot be cancelled; invalidating their callbacks
    // prevents an older request from restoring a cancelled or replaced route.
    routeRequestId.current += 1;
    setDirections(null);
    setActiveDestination(null);
    setIsRouting(false);
    setShowSaveInput(false);
    setSaveRouteName('');
    setNavigationError('');
  }, []);

  const requestRoute = useCallback((destination) => {
    if (!directionsService || !isDestination(destination)) return;
    cancelRoute();
    const requestId = routeRequestId.current;
    const routeDestination = { ...destination };
    setIsRouting(true);
    directionsService.route(
      {
        origin: center,
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (requestId !== routeRequestId.current) return;
        setIsRouting(false);
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          setActiveDestination(routeDestination);
        } else {
          setNavigationError(status === 'ZERO_RESULTS'
            ? 'No driving route found. Try another destination.'
            : 'Unable to get directions. Please try again.');
        }
      }
    );
  }, [directionsService, center, cancelRoute]);

  useEffect(() => () => { routeRequestId.current += 1; }, []);

  // Saved entries are destinations: get a fresh route from the current location.
  useEffect(() => {
    if (!selectedRoute || !directionsService) return;
    const destination = selectedRoute.destination;
    setSearchResult(destination);
    setInputValue(destination.address);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: destination.lat, lng: destination.lng });
      mapRef.current.setZoom(16);
    }
    requestRoute(destination);
    clearSelectedRoute();
  }, [selectedRoute, directionsService, requestRoute, clearSelectedRoute]);

  const handleSaveRoute = () => {
    if (!saveRouteName.trim() || !activeDestination) return;
    if (saveRoute({ name: saveRouteName.trim(), destination: activeDestination })) {
      setShowSaveInput(false);
      setSaveRouteName('');
    }
  };

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  const onAutocompleteLoad = (autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    cancelRoute();
    setSearchResult(null);
    if (!place.geometry?.location) {
      setNavigationError('Select a destination from the search suggestions.');
      return;
    }
    const address = place.formatted_address || place.name ||
      (place.address_components || []).map(component => component.long_name).join(', ');
    const destination = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address,
    };
    if (!isDestination(destination)) {
      setNavigationError('This destination has no usable location. Please choose another.');
      return;
    }
    setSearchResult(destination);
    setInputValue(address);
    if (mapRef.current) {
      mapRef.current.panTo({ lat: destination.lat, lng: destination.lng });
      mapRef.current.setZoom(16);
    }
  };

  const handleInputChange = (event) => {
    cancelRoute();
    setInputValue(event.target.value);
    setSearchResult(null);
  };

  const clearInput = () => {
    cancelRoute();
    setInputValue('');
    setSearchResult(null);
  };

  const onUnmount = useCallback(function callback() {
    routeRequestId.current += 1;
    mapRef.current = null;
  }, []);

  const handleCompass = () => {
    if (mapRef.current) {
      mapRef.current.setHeading(0);
    }
  };

  const toggleMapType = () => {
    setMapType(prevType => prevType === 'roadmap' ? 'satellite' : 'roadmap');
  };

  const toggleTraffic = () => {
    if (!showTraffic) setMapType('roadmap');
    setShowTraffic(show => !show);
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);  // Start loading
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCenter(pos);
          if (mapRef.current) {
            mapRef.current.panTo(pos);
            mapRef.current.setZoom(16);
          }
          setIsLocating(false);  // Stop loading
        },
        () => {
          setNavigationError("Unable to get your location. Check location access and try again.");
          setIsLocating(false);  // Stop loading even if there's an error
        },
        { timeout: 10000 }  // Set a timeout of 10 seconds
      );
    } else {
      setNavigationError("Your browser does not support location access.");
    }
  };

  const handleChargerLocations = () => {
    if (mapRef.current) {
      const service = new window.google.maps.places.PlacesService(mapRef.current);
      const request = {
        location: center,
        radius: '5000',
        type: ['electric_vehicle_charging_station']
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setChargers(results);
        }
      });
    }
  };

  const calculateRoute = () => requestRoute(searchResult);

  const endNavigation = () => {
    clearInput();
    if (mapRef.current) {
      mapRef.current.panTo(center);
      mapRef.current.setZoom(16);
    }
  };

  return (
    <div className="MapNavigation">
      <div className="topMenuBar">
        <div className="carLockWrapper">
          <CarLock />
        </div>
        <UserProfile />
        <div className="wifiStatus">
          <img src={getImagePath("icon-wifi.svg")} alt="Wifi Status" onClick={onWifiClick} />
        </div>
        <div className="clock">
          <Clock />
        </div>
        <div className="outsideTemp">
        <OutsideTemp />
        </div>
        <div className="airbagStatus no-select">
          <img src={getImagePath("icon-airbags.svg")} alt="Airbag Status" />
          <div className="airbagStatusText">PASSENGER AIRBAG&nbsp;<span className="airbagStatusOff">OFF</span></div>
        </div>
      </div>
      <div className="mapOverlayWrapper">
        {(loadError || navigationError || storageError) && (
          <div className="navigationError" role="alert">
            {loadError ? 'The map could not be loaded. Check your connection and Maps configuration.' : navigationError || storageError}
          </div>
        )}
        {isLoaded && (
          <Autocomplete
            onLoad={onAutocompleteLoad}
            onPlaceChanged={onPlaceChanged}
            options={{ fields: ['place_id', 'geometry', 'name', 'formatted_address'] }}
            className="custom-autocomplete-container"
          >
            <form className="floatingBtn navBtn" onSubmit={(e) => { e.preventDefault(); }}>
              <img className="searchIcon" src={getImagePath("icon-search.svg")} alt="Search Map" />
              <input 
                ref={inputRef}
                placeholder="Navigate" 
                name="NavigateTo"
                value={inputValue}
                onChange={handleInputChange}
                id="navigateTo"
              />
              {inputValue && (
                <button type="button" className="clearInput" onClick={clearInput}>
                  <img src={getImagePath("icon-x.svg")} alt="Clear input" />
                </button>
              )}
            </form>
          </Autocomplete>
        )}
        {searchResult && !isNavigating && !isRouting && (
          <button className="floatingBtn navigateBtn" onClick={calculateRoute}>
            Navigate
          </button>
        )}
        {isRouting && (
          <div className="navigatingBtnsWrapper" role="status">
            <span>Finding directions…</span>
            <button className="floatingBtn endNavigateBtn" onClick={endNavigation}>Cancel Navigation</button>
          </div>
        )}
        {isNavigating && (
          <div className="navigatingBtnsWrapper">
            <button className="floatingBtn endNavigateBtn" onClick={endNavigation}>
              End Navigation
            </button>
            {!showSaveInput ? (
              <button
                className="floatingBtn saveRouteBtn"
                onClick={() => { setShowSaveInput(true); setSaveRouteName(activeDestination.address); }}
              >
                <img src={getImagePath("icon-settings-navigation.svg")} alt="Save" className="saveRouteIcon" />
                Save Route
              </button>
            ) : (
              <div className="saveRouteInputWrapper">
                <input
                  className="saveRouteInput"
                  type="text"
                  placeholder="Route name..."
                  value={saveRouteName}
                  onChange={(e) => setSaveRouteName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRoute(); if (e.key === 'Escape') setShowSaveInput(false); }}
                  autoFocus
                />
                <button className="saveRouteConfirmBtn" disabled={!saveRouteName.trim()} onClick={handleSaveRoute}>Save</button>
                <button className="saveRouteCancelBtn" onClick={() => setShowSaveInput(false)}>
                  <img src={getImagePath("icon-x.svg")} alt="Cancel" />
                </button>
              </div>
            )}
          </div>
        )}
        <div className="floatingRightBtnsWrapper">
          <button className="floatingBtn squareBtn compassDirection" onClick={handleCompass}>
            <img className="icon-compass" src={getImagePath("icon-compass.svg")} alt="Compass" />
          </button>
          <div className="floatingRightBtnColumn">
            <button className="floatingBtn squareBtn btnGroup" onClick={toggleMapType}>
              <img className="icon" src={getImagePath("icon-globe.svg")} alt="Map Style" />
            </button>
            <button className="floatingBtn squareBtn btnGroup" onClick={toggleTraffic} aria-pressed={showTraffic}>
              <img className="icon" src={getImagePath("icon-traffic.svg")} alt="Toggle Traffic" />
            </button>
            <button className="floatingBtn squareBtn btnGroup" onClick={handleLocation}>
              {isLocating ? (
                <LoadingSpinner />
              ) : (
                <img className="icon" src={getImagePath("icon-map-marker.svg")} alt="Location" />
              )}
            </button>
            <button className="floatingBtn squareBtn btnGroup" onClick={handleChargerLocations}>
              <img className="icon" src={getImagePath("icon-charger-locations.svg")} alt="Charging Locations" />
            </button>
          </div>
        </div>
      </div>
      <div className="mapBackground">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={16}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              mapId: MAP_ID,
              mapTypeId: mapType,
              disableDefaultUI: true,
              gestureHandling: 'greedy',
              zoomControl: false,
              mapTypeControl: false,
              scaleControl: false,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: false
            }}
          >
            {showTraffic && mapType === 'roadmap' && <TrafficLayer />}
            {markerIcon && (
              <Marker
                position={center}
                icon={markerIcon}
              />
            )}
            {searchResult && !isNavigating && (
              <Marker
                position={searchResult}
                icon={{
                  url: getImagePath("icon-map-marker.svg"), // Image for Map Navigation search result
                  scaledSize: new window.google.maps.Size(40, 40)
                }}
              />
            )}
            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: "#1976D2",
                    strokeWeight: 5,
                  },
                }}
              />
            )}
            {chargers.map((charger, index) => (
              <Marker
                key={index}
                position={charger.geometry.location}
                icon={{
                  url: getImagePath("icon-charger.svg"),
                  scaledSize: new window.google.maps.Size(30, 30)
                }}
              />
            ))}
          </GoogleMap>
        ) : <></>}
      </div>
    </div>
  );
}