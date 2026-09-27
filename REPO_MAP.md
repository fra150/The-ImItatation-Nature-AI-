# 🗺️ Repository Map — The ImItatation Nature AI
> Generata: 2026-09-27 · main `72a04ed` · Scopo: orientare Aider/agenti sui path reali.

## Root
```
The-ImItatation-Nature-AI--main/
├── src/                    # Backend Express (API, auth, RBAC, MQTT, socket)
│   ├── app.js              # Wiring: /auth pubblico, mutazioni protette, /api/users admin
│   ├── config/environment.js  # PORT default 3001, JWT_SECRET fail-fast
│   ├── controllers/authController.js  # register forza viewer, login+refresh rotazione, logout revoca
│   ├── middleware/auth.js  # JWT verify + role check
│   ├── middleware/rbac.js  # requireRole(admin/operator/viewer), dopo auth
│   ├── middleware/validator.js + rateLimiter.js  # 400 {errors[]}, 429 JSON+Retry-After
│   ├── models/user.js      # ENUM admin/operator/viewer
│   ├── models/refreshToken.js  # tokenHash sha256, expiresAt, revokedAt
│   ├── models/index.js     # associazioni + CASCADE
│   ├── routes/authRoutes.js   # /register pubblico solo viewer, /login, /refresh, /logout
│   ├── routes/userRoutes.js   # admin-only mutazioni, validazione, sanitize password
│   ├── routes/ + controllers/ # sensors, drones, areas, fire-events, forest, weather, classification
│   └── services/iotGateway.js + realtimeService.js  # MQTT degraded senza broker, socket JWT
├── frontend/               # SaaS React+Vite (porta 5173, API :3001)
│   ├── src/api.js          # BASE :3001, single-flight refresh, parse errors[].msg, 429 no-logout
│   ├── src/auth.jsx        # login valida token, logout revoca reale best-effort
│   ├── src/App.jsx         # Protected valida forma JWT
│   ├── src/pages/Login.jsx + Register.jsx  # dev-only hint, role viewer
│   ├── src/pages/Dashboard.jsx  # banner loadError, live socket, overlay spread
│   └── vite.config.js      # host:true, port 5173
├── scripts/seed.js         # force:true + blocco prod, 3 hash separati, 3 utenti/ruoli
├── tests/                  # 19 suite, 106 test (rbac, authRefresh, db.integration, droneRelease…)
├── filemd/                 # diario.md, cosa fare.md (locale!), REFACTORING_PLAN.md
├── .aider.conf.yml         # config Aider (model, repo-map, read-only)
├── .aiderignore            # esclusioni secrets/DB/build
└── .env.example            # template (PORT=3001, JWT, MQTT, EE, Gemini)
```

## Flussi chiave
- **Auth:** `POST /auth/register (viewer)` → `POST /auth/login {token,refreshToken}` → `GET` pubbliche / mutazioni `Bearer` → `POST /auth/refresh` single-use → `POST /auth/logout` revoca.
- **RBAC:** `auth` → `requireRole`: viewer mai muta, operator muta operativo, admin anche `/api/users`.
- **Realtime:** Socket.io JWT handshake, eventi `drone:update/fire:new/fire:dispatch`.
- **IoT:** `drones/{id}/telemetry` → DB → `drone:update`; comandi via `sendCommand/sendMission/release-agent`.

## Porte & env
- Backend `:3001` (`PORT`), frontend `:5173` (`vite`), `:3000` = Grafana (mai usare).
- `frontend/.env.local` → `VITE_API_URL=http://localhost:3001` (gitignored, ricreare ogni sessione).
- Mai committare: `.env`, `secrets/`, `*.sqlite`, `frontend/.env.local`, `*.log`, `.claude/`.

## Test & build
- `npm test` → 106/106 · `cd frontend; npm run build` → pulito.
- Push token effimero: `git -c credential.helper= push "https://<token>@github.com/..." main` → `ls-remote` → pulisci.
