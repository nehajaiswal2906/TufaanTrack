# TufaanTrack — Frontend

The web interface for **TufaanTrack**, a space-based disaster-management platform for cyclone
preparedness and emergency response, currently focused on **Puri district, Odisha**.

Built with **React + Vite**, **React Router**, **Leaflet / React-Leaflet** and **Lucide** icons.
All data comes from the TufaanTrack backend (FastAPI) — the frontend never invents data.

---

## Run it locally

You need **Node.js 20+** and the backend running.

**1. Start the backend** (in its own terminal — see `docs/API_CONTRACT.md`):

```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

It runs at `http://127.0.0.1:8000`. Check `http://127.0.0.1:8000/api/health` shows `{"status":"ok"}`.

**2. Start the frontend** (in a second terminal):

```bash
cd frontend
npm install        # first time only
npm run dev
```

Open **http://localhost:5173**.

### Other commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with live reload |
| `npm run lint` | Checks the code for mistakes |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serves the production build locally |

### Backend address

Set in **`frontend/.env`**:

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Change it if the backend runs elsewhere, then restart `npm run dev`.
The sidebar footer shows **Backend online / offline** and the address in use.

---

## Deployment (prototype)

**Frontend → Vercel** · **Backend → Render** (both free tiers).

1. **Backend on Render** — New → Web Service → connect the GitHub repo:
   - Root Directory: *(leave empty — the backend reads `data/` and `analysis/`)*
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Instance type: Free. Copy the URL it gives you (e.g. `https://tufaantrack-api.onrender.com`).
2. **Frontend on Vercel** — Add New → Project → import the repo:
   - Root Directory: `frontend` · Framework: Vite (auto-detected)
   - Environment Variable: `VITE_API_BASE_URL` = the Render URL (no trailing `/`)
   - `frontend/vercel.json` makes page links like `/map` work after a refresh.
3. Every push to `main` redeploys both automatically.

**Free-tier limits (shown to users in the interface):**
- The backend sleeps after 15 minutes without traffic and takes up to ~1 minute to wake up —
  the site shows a "Connecting to the backend…" banner meanwhile and re-checks every 30 s.
- Render's free disk is temporary: **SOS reports saved in SQLite are lost** when the backend
  restarts, redeploys or sleeps. For permanent reports the backend needs a hosted database.

---

## Pages

| URL | Page | Backend endpoints |
|---|---|---|
| `/` | Operations dashboard — counts, map, cyclone summary, priorities, latest reports | all below |
| `/map` | Live map — settlements, shelters, hospitals and the cyclone scenario | settlements, shelters, hospitals, cyclone, warning-zone |
| `/cyclone` | Cyclone tracking — track, direction arrows, warning zones, info panel | cyclone, warning-zone |
| `/settlements` | Village list, search/sort, details panel with exposure and nearby resources | settlements, assessment |
| `/shelters` | Candidate shelters — list, type filter, details, closest settlements | shelters, roads |
| `/medical` | Hospitals and health centres — list, type filter, details | hospitals, roads |
| `/assessment` | Impact assessment — summary, charts, sortable table with reasons | assessment |
| `/reports` | Emergency reports — list, filters, map, operator status controls | reports, PATCH status |
| `/sos` | SOS form — type, description, village, location on map | POST sos |

`/settlements?village=PURI-V0025` opens with that village selected.

---

## Project structure

```
frontend/
├── .env                      Backend address
├── index.html                Page shell, font, title
└── src/
    ├── main.jsx              Starts React + the router
    ├── App.jsx               URL → page routes (pages load on demand)
    ├── App.css / index.css   Global theme (navy + teal)
    ├── config/               Settings: navigation, map, priorities, report types, facility types
    ├── services/             ALL backend communication (api.js) + data loaders
    ├── hooks/useApi.js       Loading / error / retry for any backend call
    ├── utils/                GeoJSON conversion, direction, straight-line distance
    ├── components/
    │   ├── Layout, Sidebar, Topbar, StatCard, PriorityBadge, ReportsBell
    │   ├── MapView.jsx       The shared map used by every page
    │   ├── map/              Markers, popups, legend, controls, cyclone layers, map.css
    │   ├── cyclone/          Cyclone information panel
    │   ├── settlements/      Village list + details panel
    │   ├── infrastructure/   Shared page for shelters and medical facilities
    │   ├── assessment/       Bar chart + assessment table
    │   └── reports/          Report cards, status badge, SOS/report styles
    └── pages/                One file per page
```

**Where to change things**

- Backend address → `.env`
- Add a page → `src/config/navigation.js` + a route in `src/App.jsx`
- Marker colours / icons / map start position → `src/config/mapConfig.js`
- Priority colours → `src/config/priority.js`
- SOS report types → `src/config/reports.js`
- All API calls → `src/services/api.js`

---

## Data notes (shown in the interface too)

The interface labels these limits wherever the data appears:

- **Cyclone scenario is simulated** ("Simulated Cyclone ASTRA") — not an IMD forecast or warning.
- **Populations** — most are assumed defaults (`pop_source: "estimated_default"`), not Census data.
- **Shelters** — schools from OpenStreetMap used as *candidate* shelters; designation, safety and
  capacity (default 50) are unverified.
- **Beds** — `0` means unknown in the data, so bed counts are hidden until real values exist.
- **Roads** — `/api/roads` currently returns no features; the pages say so and will draw roads
  automatically when the backend provides them.
- **Distances** to the closest facilities are straight-line, calculated in the browser — not road
  distances. "Within 10 km" counts and all priorities come from the backend.
- **GeoJSON** coordinates are `[longitude, latitude]`; `src/utils/geojson.js` converts them for Leaflet.

## Known limitations

- **No login** — the backend has no authentication, so anyone using the site can change a report's
  status. The Reports page labels these as *Operator controls* and asks for confirmation.
- The SOS form records reports; it does **not** dispatch help. It tells users to call **112**.
- Map background tiles come from OpenStreetMap and need an internet connection.
- On the free hosting plan, reports reset when the backend restarts (see Deployment).
