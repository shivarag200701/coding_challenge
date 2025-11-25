# Windborne Balloon & Hazard Tracker

A real-time interactive map visualization that combines Windborne Systems' global balloon constellation positions with active weather hazards from the National Weather Service (NWS) API.

## Features

- 🎈 **Live Balloon Tracking**: Displays current positions of Windborne's global sounding balloons from the live API
- ⚠️ **Weather Hazard Mapping**: Overlays active weather alerts and hazards from the National Weather Service (NWS) API
- 🗺️ **Interactive Leaflet Map**: 2D map visualization with zoom, pan, and popup details
- 🔄 **Dynamic Updates**: Automatically refreshes balloon data (hourly) and hazard data (every 30 minutes)
- 🛡️ **Robust Data Handling**: Handles potentially corrupted or undocumented API responses gracefully

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Leaflet** & **react-leaflet** for map visualization
- **Tailwind CSS** for styling
- **National Weather Service (NWS) API** for weather hazard data

## Project Structure

```
src/
├── api/
│   ├── balloon.ts          # Balloon API client
│   └── alert.ts            # NWS alerts API client
├── components/
│   └── BalloonMap.tsx      # Main map component
├── hooks/
│   ├── useBalloonData.ts   # Hook for balloon data fetching
│   └── useAlertData.ts     # Hook for alert data fetching
└── utils/
    └── balloonData.ts      # Utilities for processing balloon data
```

## Why NWS Alerts API?

I chose the National Weather Service (NWS) alerts API because it provides real-time, comprehensive weather hazard data that directly relates to balloon flight safety. By combining live balloon positions with active weather alerts, we can identify potential risks to the constellation in real-time. This integration demonstrates practical value for operational decision-making while showcasing robust data handling of both structured and potentially corrupted datasets.

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

To deploy this application:

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to a static hosting service such as:
   - Vercel
   - Netlify
   - GitHub Pages
   - AWS S3 + CloudFront
   - Any other static hosting service

3. Update the `submission_url` in `submit-application.js` with your deployed URL

## Submitting the Application

1. Deploy your application to a publicly accessible URL
2. Update the information in `submit-application.js`:
   - Your name and email
   - Your deployed application URL
   - Your portfolio project URL
   - Your resume URL
3. Run the submission script:

```bash
node submit-application.js
```

Make sure you get a 200 status code! Any other status means the application wasn't accepted.

## API Details

### Balloon API

- **Base URL**: `https://a.windbornesystems.com/treasure/`
- **Endpoints**: `00.json` (current), `01.json` (1 hour ago), up to `23.json` (23 hours ago)
- **Note**: The API is undocumented and may sometimes return corrupted data. The application handles this robustly.

### NWS Alerts API

- **Base URL**: `https://api.weather.gov/alerts/active`
- Returns GeoJSON features with active weather alerts
- Includes severity, urgency, event type, description, and geographic boundaries
- Provides comprehensive weather alert data for the United States

## License

This project was created for the Windborne Systems coding challenge.
