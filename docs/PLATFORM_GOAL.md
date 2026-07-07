# GOAL PROMPT — JSBSim Mission Control + Model Designer

> Paste this whole document into a fresh Claude Code session at the root of the
> `guptaronav/jsbsim-wasm` repo. Attach the two reference mockups (dark
> "Mission Control" dashboard + light "JSBSim Model Designer") so the
> implementer can match them pixel-for-pixel. Work in `demo/`.

---

## Role & mission

You are building the **final version of a fully browser-based JSBSim flight-simulation
platform**. Everything runs client-side against JSBSim compiled to WebAssembly —
no backend. The platform has **two surfaces** joined by one app shell:

1. **Model Designer** (light theme) — a schema-driven, form-based editor for
   authoring & validating JSBSim aircraft/model XML, with import/export.
2. **Mission Control** (dark theme) — a live + replayable telemetry cockpit that
   runs a designed model, streams sensor events, charts channels, renders a 3D
   rocket and GPS trajectory, and lets you scrub recorded sessions on a timeline.

The user authors a model in the Designer, then runs and replays it in Mission
Control. Build both to match the attached mockups.

## Repo you're building on (reuse, don't rewrite)

- Stack: **React 18 + TypeScript + Vite**, deployed to GitHub Pages
  (`.github/workflows/deploy-pages.yml`, base `/jsbsim-wasm/`).
- JSBSim SDK is imported as `@sdk` (alias to `../src/index.ts`): `JSBSimSdk`
  (`create`, `loadScript`, `runIc`, `run`, `getPropertyValue`,
  `setPropertyValue`, `getSimTime`, `writeDataFile`, `readDataFile`,
  `configurePaths`, `on("stdout"/"stderr")`, `destroy`). WASM assets live in
  `demo/public/wasm/` and are already committed.
- Scenario/model assets: `demo/public/scenario/hobby-rocket/` (`manifest.json`,
  `aircraft/hobby_rocket/*.xml`, `scripts/*.xml`).
- Reuse these existing modules — refactor as needed, keep their tested cores:
  - `demo/src/hooks/useSimulation.ts` — scenario bootstrap, sim loop, telemetry
    sampling, stage detection, model-editor file IO.
  - `demo/src/lib/SimulationEngine.ts`, `TrajectoryTracker.ts`,
    `CoordinateTransform.ts` (WGS84→ECEF→ENU), `exportData.ts`.
  - `demo/src/components/FlightViewer3D.tsx` (Three.js, lazy-loaded).
  - Monaco is self-hosted via `demo/src/lib/monacoSetup.ts` (keep for a raw-XML
    fallback view inside the Designer).
- Tooling already in place: CI (`ci.yml`: typecheck + `vitest`), `npm ci` on
  Node 22, `recharts`, `three`, `@monaco-editor/react`. Keep CI green.

**Design pivot:** these mockups define the new visual direction and supersede the
current "editorial flight-log" theme (Fraunces/serif/graph-paper). Retire it (or
keep only as an unlinked legacy route). Do not carry its tokens into the new UI.

---

## Surface A — Mission Control (dark cockpit)

Match mockup 1. Dense, instrument-grade, dark. Layout:

### App/header bar
- Left: session name/id. Right: connection/mode chips — `idle` and a green
  `run`/`live` indicator; a `sim ok` health pill.

### Configurable metric bar (top row)
- A row of **metric tiles**, each with a **dropdown to pick which channel it
  displays**, a large numeric value, and a unit. Defaults from the mockup:
  Velocity (m/s), Acceleration (m/s²), Altitude (m), Mission Time (s),
  RSSI/SNR (link quality, e.g. `-104 / 8.9`).
- Channels are any telemetry/derived property; tiles are user-configurable and
  persisted (URL or localStorage). Add/remove tiles.

### Simulation Control panel (left)
- Numeric inputs: `tick_ms` (e.g. 200), `duration_ms` (e.g. 15000),
  `initial_alt_m` (e.g. 0). **Start** / **Stop** buttons (blue/red). Show the
  active **session id** token and a `sim ok` status.
- Starting a run creates a **recorded session** (see Sessions below).

### Live Events log (left, below control)
- Virtualized, auto-scrolling stream. Each row: **channel name**, `t=<simTime>`,
  `seq=<n>`. Emit a realistic **sensor suite** at the tick rate:
  `imu.accel`, `imu.gyro`, `gps.fix`, `baro.sample`, `kinematics.sample`, plus
  lifecycle events (`simulation_started`, `stage.*`, `apogee`,
  `simulation_ended`). Filter/search + pause.

### Chart panel (center)
- **Multi-series time chart** (use `recharts`). Legend chips per series with an
  `×` to remove, and a **`+ series`** control to add any channel. X = time.
  Default series: Altitude, Velocity, Acceleration. Smooth, dark-styled axes.

### Rocket Visualisation (center/right)
- 3D rocket on a ground plane (extend `FlightViewer3D`), with an attitude HUD
  readout: `roll`, `pitch`, `yaw`, `alt`. Camera tracks the vehicle.

### GPS Trajectory (right)
- 3D ENU axes plot (east/up/north) with the flight-path polyline and a readout
  (`pts`, `x east`, `y up`, `z north`). Feed from `TrajectoryTracker` +
  `CoordinateTransform`.

### Timeline scrubber (bottom)
- Playback bar over the **recorded session**: scrub, play/pause, speed (0.5–4×),
  and a live/replay toggle. Scrubbing drives every panel (metrics, chart, 3D,
  events) to the state at that time.

### Sessions (recording + replay)
- On Start, record every event + a telemetry frame per tick into an in-memory
  (and optionally IndexedDB) **session buffer** keyed by session id.
- Replay reconstructs all panels deterministically from the buffer. Export a
  session to JSON/CSV (extend `exportData.ts`).

---

## Surface B — Model Designer (light, schema-driven)

Match mockup 2. Header: **"JSBSim Model Designer — Reusable editor shell for
building and validating JSBSim model files."** with **Import Files** /
**Download Files** buttons and a green **validation** indicator.

### Tabs = JSBSim model sections
`General Information` (fileheader), `Metrics`, `Mass & Balance` (mass_balance),
`Ground Reactions` (ground_reactions), `Propulsion`, `Flight Control`
(flight_control), `Aerodynamics`. Active tab is a white pill on a gray tab bar.

### "Reusable editor shell" = declarative field schema
- Drive each section's form from a **TypeScript schema** (field id, label, type,
  unit, help text, validation, JSBSim XML path). Rendering, validation, and
  XML round-trip are generic over the schema so new fields are one-line additions.
- Field types: text, number+unit, select, group/repeatable, and **function**
  (see below). Show helper text under fields (as in the Aerodynamics mockup).

### Aerodynamics tab (build this fully as the reference implementation)
- **Aerodynamics Setup**: `Axis System` select (e.g. "Lift/Drag/Side +
  Roll/Pitch/Yaw"), `Alpha Min`/`Alpha Max` (deg, with the stall-logic help
  text), `Hysteresis Min`/`Hysteresis Max` (deg, with help text).
- **Reference Point Shift**: optional `aero_ref_pt_shift_x` function + Add Function.
- **Global Functions**: optional top-level `<function>` elements + Add Function.
- **Axis Functions**: per axis (LIFT, DRAG, SIDE, ROLL, PITCH, YAW) a list of
  `<function>` graphs that contribute a force/moment term, each with Add Function.

### Function editor (JSBSim `<function>` builder)
- A small visual/structured editor for JSBSim functions: `property`, `value`,
  `table` (independentVar + tableData), and math nodes (`product`, `sum`,
  `difference`, `quotient`, `pow`, `abs`, `sin`, `cos`, …). Add/remove/nest.
  Provide a raw-XML escape hatch (Monaco) for the whole model.

### XML round-trip + validation
- **Import Files**: parse a JSBSim aircraft XML (start from
  `hobby_rocket.xml`) into the section schemas.
- **Download Files**: serialize the schemas back to valid JSBSim XML
  (stable formatting, deterministic order).
- **Validate**: structural/required-field/units checks; surface the green check
  when valid, inline errors when not.
- **Run this model**: hand the edited XML to Mission Control (write into the
  SDK VFS via `writeDataFile`, reload the scenario) so authoring → flying is one flow.

---

## Design tokens (derive exact values from the mockups)

- **Mission Control (dark):** near-black app bg, subtle 1px panel borders,
  mono for numerics/event log, semantic accents (blue = start/primary, red =
  stop, green = healthy), chart series in a categorical palette (blue/green/
  amber). Compact spacing, instrument feel.
- **Model Designer (light):** soft blue-gray page bg, white rounded cards,
  primary blue buttons/links, gray tab bar with white active pill, sans-serif
  (Inter/system), generous spacing, muted gray helper text.
- Centralize both as CSS variables/themes; the app shell switches theme by
  surface. Support `prefers-reduced-motion` and keep AA contrast.

---

## Architecture notes

- **Telemetry model:** define a typed channel registry (id, label, unit,
  source/derivation). Metric tiles, chart series, and events all reference it.
- **Sensor emitters:** derive `imu.*`, `gps.fix`, `baro.sample`,
  `kinematics.sample` from JSBSim properties each tick; add plausible noise for
  IMU/RSSI. Keep emitters pure and unit-tested.
- **Session store:** append-only per-tick frames + events; selectors reconstruct
  any panel at time `t`. This powers both live and scrub/replay.
- **Designer core:** `schema → form` renderer, `xml ↔ model` codec, validator —
  all pure and unit-tested, independent of React.
- **Routing:** `/designer` and `/mission-control` (+ deep-linkable session/replay
  and metric/series config via URL state).

---

## Milestones (ship each behind green CI + a working preview)

- **M0 — Shell & themes.** App shell, routing, dark/light theme systems, nav.
- **M1 — Telemetry & channel registry.** Channel model + sensor emitters + tests.
- **M2 — Mission Control core.** Sim control panel, configurable metric tiles,
  live event stream.
- **M3 — Chart + 3D + GPS.** Multi-series add/remove chart, rocket viz w/ HUD,
  ENU trajectory.
- **M4 — Sessions + timeline.** Recorder, replay selectors, scrubber, export.
- **M5 — Designer shell.** Schema framework, tabs, import/download/validate,
  full Aerodynamics tab.
- **M6 — Function editor + remaining tabs.** `<function>` builder; other sections.
- **M7 — Integration & polish.** Designer → Mission Control "Run this model",
  responsive passes, a11y, perf (lazy-load three/monaco/charts), docs.

---

## Definition of done

- Matches the mockups on desktop; responsive at 1440/1024/768 without overflow.
- Whole simulate → record → replay loop works entirely in-browser; scrubbing is
  deterministic. Designer round-trips `hobby_rocket.xml` (import → edit →
  download → run) with validation.
- `npm ci`, `npx tsc --noEmit` (app + node), and `npx vitest run` all pass; pure
  cores (channels, sensors, session selectors, xml codec, validator) have unit
  tests. **CI green, GitHub Pages deploy green**, live site loads with no CDN
  runtime deps and no console errors.

## Constraints & non-goals

- Browser-only; no backend, no auth. Keep bundle sane: lazy-load Three.js,
  Monaco, and heavy chart code so the initial route is light.
- Don't reintroduce `react-leaflet`/leaflet (removed for a React-18 peer
  conflict) — GPS/trajectory is the 3D ENU plot, not a map tile view.
- Don't regress accessibility already added (event severity uses shape + label,
  not color alone; reduced-motion respected).

## How to work

Plan first, then build **incrementally per milestone** — small, verifiable steps.
Prefer test-first for the pure cores. After each UI change, **run the dev server
and verify in the browser** (screenshot key states) instead of assuming. Keep
each milestone shippable with CI green and the Pages deploy working. Ask before
any destructive/irreversible action.
