![The Imitatation Nature AI in Action](assets/fire_prevention.gif)

# The Imitatation Nature AI: Fire Protection for Our Forests

A future where forest fires are stopped in their tracks.

The Imitatation Nature AI (inspired by Alan Turing) is a wildfire-prevention system: satellite data, ground sensors, and an autonomous drone fleet talk to a single backend ("Bot Padre") that detects fires and dispatches the nearest available drone — in real time.

## Table of Contents

1. [The Problem](#the-problem-a-growing-global-threat)
2. [What Actually Works Today](#what-actually-works-today)
3. [Architecture](#architecture)
4. [Running It](#running-it)
5. [Limitations & Honest Status](#limitations--honest-status)
6. [Roadmap](#roadmap)
7. [Contacts](#contacts)
8. [License](#license)

## The Problem: A Growing Global Threat

Forest fires cause irreparable environmental damage, endanger lives, and release massive amounts of CO2. Traditional response is reactive — it intervenes only after a fire is already visible. This project focuses on catching it earlier and coordinating the response automatically.

## What Actually Works Today

This is a real, running system — not a mockup. Everything below is backed by an automated test suite (`npm test`, 70+ tests) and has been manually verified end-to-end.

- **Backend (Node/Express + Sequelize)**: JWT auth (register/login, protected mutations), a real database (SQLite by default, zero setup; MySQL for production), and a full CRUD surface for areas, sensors, drones, fire events, weather and forest data.
- **Google Earth Engine — live**: 5 endpoints serve real satellite imagery from a service account: forest-change detection (Hansen dataset), ERA5 temperature, RTMA wind, and supervised/unsupervised land-cover classification.
- **Fire → drone dispatch pipeline**: detecting a fire (`POST /api/fire-events/detect`, or automatically from a sensor reading over threshold) creates a `FireEvent` and dispatches the nearest *available* drone by real GPS distance. Releasing the extinguishing agent closes the loop: the fire is marked extinguished and the drone is freed for its next mission.
- **Real-time (Socket.io, JWT-protected)**: the dashboard updates live — drone telemetry, new fires, dispatches, and resolutions — with no polling or page reloads.
- **IoT / MQTT gateway**: drones and sensors are hardware-agnostic MQTT devices (`drones/{id}/{telemetry,status,ack,commands}`, `sensors/{id}/telemetry`). The gateway degrades gracefully with no broker connected.
- **Connection health**: the gateway tracks WiFi/radio signal strength (RSSI), link quality, and latency per drone; a backend watchdog automatically marks a drone offline if its telemetry goes silent, and raises a weak-signal alert when the link degrades — because a real radio link drops without asking permission.
- **A virtual drone (SITL)**: `scripts/virtualDrone.js` speaks the *exact* protocol a physical drone will — it simulates real flight (GPS chasing waypoints, battery drain, low-battery return-to-home) and real link physics (signal degrading with distance from base). It lets you fly and demo the entire system with zero hardware; the physical drone is a drop-in replacement.
- **Frontend (React + Vite)**: a login-gated dashboard with a live Leaflet map (areas, sensors, drones, fires), an Earth Engine panel, and a real-time connection indicator.

## Architecture

```
Physical/virtual drones & IoT sensors
        │  MQTT (telemetry / commands)
        ▼
   IoT Gateway  ──────────────►  Fire Workflow Service
        │                              │
        ▼                              ▼
     Database  ◄──────────────  Socket.io (real-time)
        │                              │
        ▼                              ▼
   REST API (Express, JWT)      React Dashboard (live map)
        ▲
        │
  Google Earth Engine / Gemini (external services)
```

## Running It

### Prerequisites

- Node.js (v18+)
- Docker, **only** if you want a real MQTT broker for drones/sensors (optional — the backend runs fine without one)

### Setup

```bash
git clone https://github.com/fra150/The-ImItatation-Nature-AI-.git
cd The-ImItatation-Nature-AI-
npm install

cp .env.example .env
# at minimum, set JWT_SECRET. Everything else has a working default or
# degrades gracefully (SQLite, no Earth Engine, no Gemini, no MQTT).

npm run seed   # demo data: users, areas, sensors, drones, fire events
npm test       # full automated suite
npm start      # or `npm run dev` for auto-reload
```

The server starts even without a reachable database or any external API key — `/health` and the route surface stay up, and each integration (Earth Engine, Gemini, MQTT, email) degrades independently instead of crashing the process.

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

Demo login (after `npm run seed`): `francesco` / `Password123!`

### Full IoT demo (backend + broker + virtual drone)

```bash
npm run broker                                              # Mosquitto via Docker, :1883
MQTT_BROKER_URL=mqtt://localhost:1883 npm start              # backend
MQTT_BROKER_URL=mqtt://localhost:1883 npm run drone:sim SKYDIO-01   # virtual drone
```

Then send it a mission (`POST /drones/:id/mission` with a JWT and a list of waypoints) and watch it fly, drain battery, and report signal strength live.

## Limitations & Honest Status

- **AI is real but scoped, not science fiction.** Gemini (`GEMINI_API_KEY`) powers text analysis/chat; it is not a deep-reinforcement-learning or graph-neural-network system. Fire-spread prediction and AI-generated incident briefings are on the roadmap, not built yet.
- **Image classification (TensorFlow.js) does not currently load** on this environment's Node version (native binding issue with `@tensorflow/tfjs-node`) — the training/classification code paths exist but are inactive until that's resolved.
- **No physical drone hardware is wired up yet.** The MQTT protocol, telemetry model, and dispatch logic are complete and hardware-agnostic; a physical fleet (DJI Cloud API or MAVLink/Pixhawk) still needs a bridge implementation — see Roadmap.
- **Fire lifecycle is intentionally simplified**: any successful extinguishing-agent release on an assigned drone closes the fire. This models the demo at incident granularity, not a water-volume-vs-fire-size physics simulation.
- **Single-tenant, single role.** There is no RBAC or multi-tenancy yet — every authenticated user has the same permissions.
- **Video feed is not live.** The realtime data endpoint returns a placeholder video URL; RTSP-to-browser streaming is not implemented.

## Roadmap

1. **Physical drone hardware** — pick DJI Cloud API (MQTT-native, works with DJI Dock) or MAVLink (Pixhawk/PX4 + a companion-computer bridge), then wire real telemetry/commands through the existing gateway.
2. **AI briefings** — a Gemini-generated incident summary (satellite + weather + sensor + drone data) and a wind-driven fire-spread estimate, shown as a map overlay.
3. **SaaS hardening** — RBAC (admin/operator/viewer), multi-tenancy, refresh tokens, per-organization drone fleets.
4. **Frontend depth** — a fire detail page, incident history, PDF/CSV export, and an in-dashboard drone command UI (today it's API-only).

## Contacts

150francescobulla@gmail.com — [demo video](https://youtu.be/lezQ6c0ONto)

## License

[Apache License 2.0](LICENSE)

### Acknowledgments

Thanks to [Google](https://about.google/) for Earth Engine and Gemini, and to firefighters everywhere for their work protecting our communities. Contributions, ideas, and collaboration are welcome.
