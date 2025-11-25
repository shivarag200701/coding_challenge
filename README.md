# Windborne Balloon & Hazard Tracker

A real-time interactive map visualization that combines Windborne Systems' global balloon constellation positions with active weather hazards from the OpenWeatherMap API.

## Features

- 🎈 **Live Balloon Tracking**: Displays current positions of Windborne's global sounding balloons from the live API
- ⚠️ **Weather Hazard Mapping**: Overlays active weather alerts and hazards from the OpenWeatherMap API (global coverage)
- 🗺️ **Interactive Leaflet Map**: 2D map visualization with zoom, pan, and popup details
- 🔄 **Dynamic Updates**: Automatically refreshes balloon data (hourly) and hazard data (every 30 minutes)
- 🛡️ **Robust Data Handling**: Handles potentially corrupted or undocumented API responses gracefully

## Technology Stack

- **React 19** with TypeScript
- **Vite** for build tooling
- **Leaflet** & **react-leaflet** for map visualization
- **Tailwind CSS** for styling
- **OpenWeatherMap One Call API 3.0** for global weather hazard data

## Project Structure

```
src/
├── api/
│   ├── balloon.ts          # Balloon API client
│   └── alert.ts            # OpenWeatherMap alerts API client
├── components/
│   └── BalloonMap.tsx      # Main map component
├── hooks/
│   ├── useBalloonData.ts   # Hook for balloon data fetching
│   └── useAlertData.ts     # Hook for alert data fetching
└── utils/
    └── balloonData.ts      # Utilities for processing balloon data
```

## Why OpenWeatherMap API?

I chose the OpenWeatherMap One Call API 3.0 because it provides real-time, comprehensive weather hazard data with global coverage. Unlike the NWS API which only covers the United States, OpenWeatherMap aggregates alerts from various national weather agencies worldwide, making it perfect for tracking global balloon constellations. By combining live balloon positions with active weather alerts, we can identify potential risks to the constellation in real-time, regardless of where the balloons are located. This integration demonstrates practical value for operational decision-making while showcasing robust data handling of both structured and potentially corrupted datasets.

## Development

### Prerequisites

- Node.js 18+ and npm

### Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add your OpenWeatherMap API key:
```bash
VITE_OPENWEATHER_API_KEY=your_api_key_here
```

You can get a free API key by signing up at [OpenWeatherMap](https://openweathermap.org/api). The free tier includes access to the One Call API 3.0.

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

### OpenWeatherMap Alerts API

- **Base URL**: `https://api.openweathermap.org/data/3.0/onecall`
- **API**: One Call API 3.0
- Returns weather alerts for specified coordinates (fetched for balloon locations)
- Includes event type, description, severity, urgency, and geographic boundaries
- **Note**: Requires an API key (set via `VITE_OPENWEATHER_API_KEY` environment variable)
- Provides global coverage by aggregating alerts from various national weather agencies

## License

This project was created for the Windborne Systems coding challenge.
