# Resource Manager

A static, no-backend web app for modelling team resource allocation and finding SME coverage gaps. State lives in your browser (localStorage) and travels via JSON import / export.

## What it does

- **Team members** with a cascading priority ladder (`Leave → Meetings → Projects → BAU`, each %-of-remaining). The group flagged as BAU is the member's weekly BAU capacity.
- **Skillsets & profiles** — bundle related skills (e.g. *Cloudcase profile* = `Cloudcase + Rulebook + Java + JavaScript`).
- **Member × skill matrix** — assign profiles or individual skillsets.
- **Systems** with critical flag, required skillsets/profiles, and release cadence (team / vendor / LTS / patch) + hours-per-event. Weekly BAU hours are *derived*: `Σ (freqPerYear × effortPerEvent) / 52`.
- **SME matrix** — member × system at level 0 / 1 / 2.
- **Dashboard** — per-system required vs allocated, deficit, SME counts, ≥2 L2 coverage check, required-skill coverage, per-member capacity & slack, and an allocation grid with manual overrides.

## Local development

```sh
npm install
npm run dev
```

Open http://localhost:5173. Click **Load seed** in the top bar for example data.

## Deploy to GitHub Pages

1. Push this repo to GitHub with `vite.config.ts`'s `base: '/resource-manager/'` matching your repo name.
2. In repo **Settings → Pages**, set **Source = GitHub Actions** (one-time).
3. Push to `main`; the workflow in `.github/workflows/deploy.yml` builds and publishes to Pages.
4. The site uses `HashRouter`, so deep links and refreshes work without SPA fallback config.

If you fork to a different repo name, update `base` in `vite.config.ts`.

## Data persistence

- **localStorage** — autosaved under key `resource-manager:v1` on every change.
- **Export JSON** — downloads the full state for sharing or backup.
- **Import JSON** — replaces current state. Schema is versioned; older versions migrate forward automatically.

## Architecture

```
src/
  domain/      types, BAU/allocation/derivation logic (pure, no React)
  store/       Zustand store + persist + import/export helpers
  components/  PriorityLadder, LevelCell, ImportExportBar
  pages/       Team, Skills, MemberSkills, Systems, SmeMatrix, Dashboard
```

Allocation default: a member's BAU capacity is split equally across the systems where they're L2. Use the **Dashboard → Allocation breakdown** grid to enter a manual override — remaining capacity then redistributes across the other L2 systems.
