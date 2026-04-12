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
- **One-tap navigation** — Select any saved route to instantly begin turn-by-turn directions
- **Persistent storage** — Routes are saved to localStorage so they survive page refreshes
- **Full CRUD** — Save, rename, delete, and navigate to routes seamlessly

### Other Enhancements
- Custom user profile integration
- Resolved all fixable lint and console warnings across the codebase

## Features
- Realistic 3D model of Tesla Model Y — open the trunk and frunk!
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
- P: Park
- R: Reverse
- N: Neutral
- D: Drive

### Music Controls
- Space: Play/Pause
- Shift + <: Previous track
- Shift + >: Next track

## Quick Start
To run the project locally:

1. Clone the repository:
   ```
   git clone https://github.com/jamesalmeida/tesla-infotainment.git
   cd tesla-infotainment
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Use the `.env.template` to create your own `.env` file. Add your API key for [Google Maps](https://cloud.google.com/maps-platform) and also a mapID for the maps styles to match Tesla's car maps. You can use mine (it's in the template) or create your own.


4. Start the development server:
   ```
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production
To create a production-ready build:

```
npm run build
```

This command builds the app for production to the `build` folder, optimizing the build for the best performance.

### `npm run deploy`
To make this project work as a Github Page, I added this command to deploy to a Github Page. You'll want to add the `PUBLIC_URL` to your `.env` file to point to your Github Pages URL.


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

