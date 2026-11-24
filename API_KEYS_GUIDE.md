# API Keys Reference & Production Integration Guide

This guide details all API keys, external services, and free production alternatives used in the **Geeta University CampusPool OS** platform.

---

## 1. Map Tiles & Geospatial Visualizer (Leaflet)

| Service | Requires API Key? | Status in Project | Cost / Plan | Purpose |
| :--- | :---: | :---: | :---: | :--- |
| **OpenStreetMap (Standard)** | **NO** | ✅ **Active Default** | **100% Free** | High-reliability global street & satellite base tiles with zero watermarks or quotas. |
| **CartoDB Voyager** | **YES** | ⚠️ Replaced (Removed Watermark) | Free tier requires `carto.com` API Key | Vectorized web tiles. |
| **Mapbox GL / Streets** | **YES** | Optional Alternative | Free up to 50,000 monthly map loads | Custom stylized 3D campus buildings and vector styling. |
| **Google Maps JavaScript API** | **YES** | Optional Alternative | \$200 monthly free credit from Google Cloud | Alternative map renderer if institution has Google Cloud Workspace. |

### How to use OpenStreetMap (No API Key Required):
The application is pre-configured with OpenStreetMap tiles:
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
```

### If you want to use Mapbox or Google Maps:
1. **Mapbox**: Create an account at [mapbox.com](https://www.mapbox.com/) and copy your Public Access Token (`pk.eyJ1...`).
2. Add to `.env`:
   ```bash
   VITE_MAPBOX_ACCESS_TOKEN="pk.eyJ1..."
   ```

---

## 2. Student Authentication & University ERP Integration (SSO)

| Integration / Service | API Key / Credentials Required | Purpose |
| :--- | :--- | :--- |
| **Geeta University eFlow ERP / Gabis** | `CLIENT_ID`, `CLIENT_SECRET`, `ERP_BASE_URL` | Authenticates students via official university roll numbers (`GU24-CSE-1042`), fetching student details and department. |
| **Google Workspace for Education (SSO)** | `GOOGLE_CLIENT_ID` (Google Cloud Console) | Allows 1-click login using student email (`student@geetauniversity.edu.in`). |
| **SMS OTP Verification (Rapido Style)** | Twilio / Fast2SMS API Key | Sends 4-digit verification code to student mobile numbers. (Mocked with instant `4242` auto-fill for demo/testing). |

---

## 3. Real-Time Telemetry & WebSocket Push (Production Scaling)

For hackathon presentation, the simulation engine runs deterministically in the client and Node.js. For live hardware IoT shuttle integration (GPS dongles on shuttles):

| Service | API Key Required? | Free Tier | Purpose |
| :--- | :---: | :---: | :--- |
| **Firebase Realtime Database / Firestore** | Yes (`apiKey`, `projectId`) | Free Spark Plan | Syncs live latitude/longitude from shuttle OBD-II GPS trackers to student phones. |
| **Pusher / Ably WebSockets** | Yes (`PUSHER_APP_KEY`) | 200,000 free messages/day | Broadcasts instant dispatch alerts, driver arrivals, and road closure push notifications. |

---

## 4. Summary for Judges & Hackathon Presentation:
* **Current Status:** **Zero paid API keys are required to run, present, and test the entire project.**
* Map tiles run cleanly via OpenStreetMap without watermarks or limits.
* All student authentication, dispatch heuristics, road closure disruptions, and metrics are fully self-contained in React and the autonomous dispatcher engine.
