# Tesla Infotainment Simulator

A fully interactive Tesla infotainment system recreation built with React, featuring Google Maps integration, a 3D vehicle model, music controls, and a suite of in-car apps — all running in the browser.

Originally created by [James Almeida](https://github.com/jamesalmeida/tesla-infotainment). This fork by **Joseph Defendre** (MSAI Candidate, Northeastern University) adds a **Saved Routes** feature to visualize and demonstrate a real feature request for Tesla's Full Self-Driving (FSD) routing system.

[Original Live Demo](https://jamesalmeida.github.io/tesla-infotainment/)

![App Preview](public/app-preview.png)

## What's New in This Fork

### Saved Routes Feature
Save your frequent destinations and navigate to them with a single tap — just like you'd want in a real Tesla.

- **Save while navigating** — A save button appears during active navigation so you can bookmark any route
- **Saved Routes panel** — Access all your saved routes from the bottom dock; view destination, name, and date saved
- **One-tap navigation** — Select a saved destination to request a fresh driving route from your current map location
- **Persistent storage** — Valid saved destinations survive refreshes through localStorage and synchronize between tabs. If storage is blocked or full, the panel stays usable and explains that changes last only for the current session.
- **Full CRUD** — Save, rename, delete, and navigate to routes seamlessly

Each saved entry contains a name, destination coordinates, address, and creation date. It bookmarks a **destination**, not a fixed road-by-road itinerary, waypoints, or an FSD preference. Google Maps recalculates directions when you navigate. This is a browser demonstration and does not connect to a vehicle or alter FSD routing.

### Other Enhancements
- Custom user profile integration
- Request ordering and cancellation prevent stale directions from restoring old navigation
- Managed map layers, audio, timers, and arcade state have matching cleanup on unmount

## Features
- Interactive 3D model of Tesla Model 3 — open the trunk and frunk!
- Interactive infotainment system simulation with podcast playback, volume control, and more
- Put the car in reverse (click R) and see the backup camera
- Google Maps with search, traffic layers, and map style options
- Keyboard shortcuts for turn signals, hazard lights, gear selection, and more
- Responsive design — works best on desktop, but try landscape mode on mobile

## Keyboard Shortcuts
- Shift + Left Arrow: Toggle left turn signal
- Shift + Right Arrow: Toggle right turn signal
- Shift + H: Toggle hazard lights
- Shift + F: Toggle frunk (front trunk)
- Shift + T: Toggle trunk
- Shift + M: Focus on Navigate Input
- Shift + C: Backup Camera

### Gear Selection
- 1: Park (P)
- 2: Reverse (R)
- 3: Neutral (N)
- 4: Drive (D)

### Music Controls
- Space: Play/Pause
- Shift + <: Previous track
- Shift + >: Next track

## Quick Start
Use Node.js 24 (Node.js 22 is also supported). To run the project locally:

1. Clone the repository:
   ```
   git clone https://github.com/jchacker5/tesla-infotainment.git
   cd tesla-infotainment
   ```

2. Install dependencies:
   ```
   npm ci
   ```

3. Use the `.env.template` to create your own `.env` file. Add your API key for [Google Maps](https://cloud.google.com/maps-platform) and also a mapID for the maps styles to match Tesla's car maps. You can use mine (it's in the template) or create your own.


4. Start the development server:
   ```
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production
To create a production-ready build:

```
npm run build
```

This command builds the app for production to the `build` folder, optimizing the build for the best performance.

## Validation and Deployment

```sh
npm ci
CI=true npm test -- --watchAll=false --runInBand
CI=true npm run build
```

The committed npm lockfile is used by both local installs and CI. Pull requests and main-branch pushes run the React regression suite and production build with warnings treated as errors. A successful main-branch build deploys through the existing GitHub Pages workflow. `npm run deploy` is available for manual gh-pages deployments; the default homepage points to this fork. Set `PUBLIC_URL` only when deploying at a different path.

Tests cover malformed storage, quota errors, distinct IDs, rename/delete/restore, cross-tab updates, out-of-order and cancelled directions, navigation state reset, traffic-layer cleanup, map-loading errors, audio lifecycle, and arcade controls/cleanup. Google Maps is mocked in unit tests: a real API key, network connection, and browser are required to validate live Google routing and map styling. External audio and arcade assets also depend on their hosts being reachable.

Saved entries stay in browser storage; searching and requesting directions sends the selected locations to Google Maps. The Maps API key is included in the browser bundle, so configure application/referrer and API restrictions in Google Cloud. The optional `REACT_APP_GOOGLE_MAPS_MAP_ID` setting is read from the environment.

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Tech Stack
- **React 18** with functional components and hooks
- **Google Maps API** (@react-google-maps/api) for navigation
- **Three.js** (@react-three/fiber, @react-three/drei) for the 3D vehicle model
- **React Context API** for state management
- **localStorage** for data persistence
- **react-resizable-panels** for the dashboard layout

### Thanks
- [James Almeida](https://github.com/jamesalmeida) for the original Tesla Infotainment Simulator
- Ameer Studio for the [3D Tesla Model 3](https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f)
- Vasilj Miloevi for the [loading screen animations](https://codepen.io/eboye/pen/ANPxVX)
- Patrick Stillhart for the [OutRun arcade game](https://codepen.io/arcs/pen/aGzNKY)

---

**Joseph Defendre** | MSAI Candidate, Northeastern University | [GitHub](https://github.com/jchacker5)

