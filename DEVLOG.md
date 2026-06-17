# Devlog — JSBSim Browser Flight Console

A running log of the work on the `guptaronav/jsbsim-wasm` fork: a fully
browser-based JSBSim flight-simulation console with a 3D viewer, GPS
trajectory, live event feed, parameter tuning, and an in-browser model editor.

---

## 2026-06-17 — Editorial redesign, blue scheme, and Pages deploy

### Shipped
- **Editorial "flight log" UI redesign.** Replaced the generic
  sky-blue/Fredoka "vibe-coded dashboard" look with an opinionated editorial
  system: Fraunces serif display, DM Sans body, JetBrains Mono labels, hairline
  1px rules, a graph-paper ground, a paper-sheet console shell, segmented tabs,
  and serif stat readouts. Design DNA was lifted from a reference HTML artifact
  and adapted to a telemetry product.
- **Kept the blue color scheme** (primary `#0EA5E9` light / `#38BDF8` dark) with
  cool slate neutrals, after the warm-paper variant was rejected. The token
  system keeps legacy variable names so the new palette propagated across the
  whole stylesheet in one swap; light + dark themes were designed together.
- **Removed all pictographic emojis** across components (tabs, theme toggle,
  launch button, flight stages, event severity, file tree, envelope stats,
  loading screen). Kept monochrome typographic glyphs (▶ ⏭ ↺ ✕ ⚠).
- **Wired the in-browser model editor** (file tree + Monaco) into the console
  via a Dashboard / Model Editor tab switcher; fixed the `onChange` no-op and
  the save→reload flow.
- **Vite dev middleware** to serve the Emscripten `.mjs` from `/public` (Vite
  otherwise refuses to import public-dir modules from source).
- **Deployed to GitHub Pages** at <https://guptaronav.github.io/jsbsim-wasm/>
  via a new `deploy-pages.yml` Actions workflow (Vite build with
  `DEMO_BASE_PATH=/jsbsim-wasm/`, using the committed WASM — no Emscripten
  rebuild). Removed the inherited `deploy-demo-pages.yml`, which was failing on
  a peer-dependency conflict and cancelling the new workflow via a shared
  concurrency group.
- **Repointed the demo link** in `README.md` from `0x62.github.io` to the fork.

### Verified
- Light + dark themes, both tabs, file tree, and Monaco editor render.
- Simulation actually runs in-browser (event log populated; WASM loads).
- Live site returns 200 with correct base path; `jsbsim_wasm.wasm` (1.59 MB),
  `jsbsim_wasm.mjs`, and scenario assets all serve.

### Friction / incidents
- **Spotlight ↔ git SIGBUS.** Local `git status`/`diff`/`push` repeatedly died
  with signal 10 (SIGBUS) reading the `vendor/jsbsim` submodule's
  memory-mapped pack files — a macOS Spotlight indexing I/O problem on this
  repo. Worked around it by: warming packs into page cache before each op,
  building commits with git plumbing (temp index, no checkout), pushing over
  SSH, and doing the branch merge server-side via the GitHub API.
- **Corrupted `node_modules`.** Several packages (postcss, vite,
  `@rolldown/pluginutils`, three, monaco) had missing dist files and
  duplicate `* 2.*` artifacts from an earlier I/O-troubled install. Fixed with
  a clean reinstall.
- **OAuth token lacked `workflow` scope**, so `.github/workflows/*` couldn't be
  written via the REST API — pushed those over SSH instead.
- **Contribution graph:** the repo is a *fork*, so commits don't count toward
  the GitHub contribution graph regardless of branch.

---

## Earlier — Console build-out (Phases 8–14)

- Simulation engine integration over the JSBSim WASM SDK; telemetry sampling,
  stage detection (launch → burnout → coast → apogee → descent → landing),
  immutable state in `useSimulation`.
- UI surfaces: simulation controls, speed control, 3D viewer (Three.js,
  lazy-loaded), GPS trajectory, telemetry charts, flight-envelope stats, live
  event feed, parameter editor, responsive `ConsoleLayout`.
- Coordinate transforms (WGS84 → ECEF → local tangent plane), trajectory
  tracker, CSV export, error boundary + loading screen, theme system.
- Unit tests (vitest, happy-dom) and a Playwright E2E suite scaffold.

---

## Open follow-ups (see "Improvements" below)
- [ ] Add `/Users/ronav/Desktop/jsbsim-wasm` to Spotlight Privacy to end the
      git SIGBUS crashes.
- [x] Resolve the `react-leaflet@5` ↔ `react@18` peer conflict — removed the
      dead `TrajectoryMap` component and the `react-leaflet`/`leaflet` deps;
      installs no longer need `--legacy-peer-deps`. _(6a70954)_
- [x] Restore non-color cues for event severity — distinct shapes
      (info ●, warning ▲, critical ■) + `role="img"`/`aria-label`. _(6a70954)_
- [ ] Add a CI typecheck/test job separate from the deploy build. _(partial:
      CI now uses `npm install`; a clean lockfile for `npm ci` + a
      typecheck/test job are still pending.)_
- [ ] Decide on WASM-binary storage (Git LFS vs build-in-CI).
