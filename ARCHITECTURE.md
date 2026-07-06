# ARCHITECTURE.md

## Project: 个人网站 (Personal Site) — Portfolio Repository

> **Deployment**: GitHub Actions auto-deploy on push to `main`.
> **Workflow**: Edit code → VS Code Git panel Commit → Sync → auto-deploy to production.

```
src/
├── main.jsx                    # Entry — mounts <App/> + imports global.css
├── App.jsx                     # Router config — 4 routes, Layout wrapper
├── global.css                  # Design tokens (CSS vars), reset, cursor:none
│
├── components/                 # Global UI (route-agnostic)
│   ├── Layout.jsx              # Shell: ParticleTrail bg + Navbar + AudioRipples + CustomCursor + <Outlet/>
│   ├── Navbar.jsx              # Top nav — links array + NavLink
│   ├── CustomCursor.jsx        # Raw-DOM cursor: dot + ring, RAF-driven, translate3d
│   ├── AudioRipples.jsx        # Dual-origin Canvas wave engine + wireframe SVG icon
│   ├── ParticleTrail.jsx       # p5 instance mount wrapper
│   ├── PortfolioScanner.jsx    # SVG polyline chart — hover/click/magnetic nodes
│   ├── PortfolioDetail.jsx     # Category router: BookView (book) or Works (other)
│   ├── BookView.jsx            # 刊本设计 dual-mode: 01 Zine / 02 Grid
│   ├── Works.jsx               # Auto-discovery waterfall grid + lightbox
│   └── Works.module.css        # CSS Module for Works grid/layout
│
├── pages/                      # Route-level components
│   ├── About.jsx               # DNA double-helix particle deconstruction (Canvas 2D)
│   ├── Portfolio.jsx           # Orchestrator: idle scanner ↔ detail view
│   ├── Tutorials.jsx           # Save Slot — 3-item category list
│   └── Contact.jsx             # Services — wireframe booklet with single-page flip
│
├── assets/works/               # Auto-discovered image assets
│   ├── book/                   # 刊本设计 (Book Design)
│   │   ├── 01/                 # Zine mode images (7 files)
│   │   └── 02/                 # Grid mode images (14 files, with ratio metadata)
│   └── portfolio_typographydesign/  # Typography design works (9 files)
│
└── sketches/
    └── trailSketch.js          # p5.js mouse-trail sketch (canvas bg layer)
```

## Book Module — 刊本设计 (Dual-Mode Architecture)

The Book module (`BookView.jsx`) displays book/zine design works with two viewing modes:

### Mode 01 — Zine (水平滚动 / Horizontal Scroll)
- **Layout**: `position: fixed` layer that escapes all ancestor `overflow:hidden`
- **Scroll**: Full-width horizontal track via `wheel` → `scrollLeft` (vertical mouse wheel translated to horizontal)
- **Interaction**: Physical grab-and-drag (mousedown/move/up state machine via `useRef`)
- **Scrollbar**: Hidden (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`)
- **Sizing**: Images capped at `max-height: 30vh; max-width: 50vw` (~50% of original)
- **Spacing**: `35vh` top spacer for centering; `120px` gap between images; `15vw` side padding
- **Hover**: `scale(1.06)` on individual items
- **Nav**: Back-to-start arrow button appears after scrolling 200px

### Mode 02 — Standard Grid
- **Layout**: 2-column CSS Grid with `16px` gap
- **Images**: Loaded with ratio metadata extracted from filename regex `/(\d+to\d+)\.\w+$/`
- **Lightbox**: Click-to-enlarge overlay via Framer Motion `AnimatePresence`
- **Nav**: Back-to-top button appears after scrolling 100px

### Image Discovery
- Both modes use `import.meta.glob` for auto-discovery — no manual JSON config needed
- 01 images load from `/src/assets/works/book/01/`, sorted reverse alphabetically
- 02 images load from `/src/assets/works/book/02/`, sorted reverse alphabetically, with aspect-ratio extraction

### Switch Mechanism
- Mode toggle: `01` / `02` button pair rendered inline
- State: `useState('01')` — defaults to Zine mode
- Scroll-spy: separate scroll listeners per mode (horizontal for 01, vertical for 02)

## Portfolio Detail Routing

`PortfolioDetail.jsx` routes to the correct view based on `CATEGORY_MAP[categoryIndex]`:
- `'book'` → `<BookView />`
- Everything else → `<Works category={cat} />`

## Core Logic vs Static Data

### Core Logic Files
Modify these for behaviour changes:
- `App.jsx` — routes
- `Layout.jsx` — page shell structure
- `CustomCursor.jsx` — cursor physics
- `AudioRipples.jsx` — Canvas wave engine
- `ParticleTrail.jsx` + `trailSketch.js` — background particles
- `About.jsx` — DNA helix physics (inside `loop()` callback)
- `Portfolio.jsx` — scanner↔detail state machine
- `PortfolioScanner.jsx` — SVG line chart + magnetic interaction
- `BookView.jsx` — dual-mode state machine, grab-drag, scroll-spy
- `Works.jsx` — auto-discovery grid + lightbox
- `Contact.jsx` — booklet flip state machine + FlipCard
- `global.css` — design tokens

### Static Content Data
Modify these for text/image changes:
- `Navbar.jsx` → `LINKS` array
- `PortfolioScanner.jsx` → `CATEGORIES` array
- `PortfolioDetail.jsx` → `CATEGORY_MAP` array
- `Tutorials.jsx` → list items in JSX
- `About.jsx` → bio text in JSX return
- `Contact.jsx` → `SHEETS` array
- `data/works.json` → metadata for portfolio works (id, title, category, year, material, dims, desc)

### Asset Management
- Book images: drop into `src/assets/works/book/01/` (Zine) or `src/assets/works/book/02/` (Grid) — auto-discovered
- Works images: drop into `src/assets/works/{category}/` — auto-discovered via glob
- Audio: `public/audio/bgm.mp3`
- Logo: `public/assets/design/logo_ppl.png`

## File Size Map

| File | Lines | Type |
|------|-------|------|
| Contact.jsx | 478 | Logic-heavy (booklet state machine + 4 pages content) |
| About.jsx | 472 | Logic + Content (DNA engine + bio text) |
| BookView.jsx | 230 | Logic-heavy (dual-mode, grab-drag, scroll-spy) |
| PortfolioDetail.jsx | 47 | Light router (category → view) |
| AudioRipples.jsx | 254 | Pure Logic (Canvas engine) |
| PortfolioScanner.jsx | 223 | Logic-heavy (SVG chart + interaction) |
| CustomCursor.jsx | 163 | Pure Logic (RAF + DOM) |
| Works.jsx | 95 | Logic + auto-discovery |
| Tutorials.jsx | 91 | Mostly Content |
| Layout.jsx | 83 | Pure Logic (structure) |
| Portfolio.jsx | 71 | Pure Logic (state machine) |
| Navbar.jsx | 70 | Content + minimal Logic |

## Key Architecture Decisions

1. **Canvas rendering uses `useRef` not `useState`** — AudioRipples, About DNA, trailSketch all drive animation via RAF + refs. No React re-renders in hot loops.

2. **Cursor uses raw DOM** — `translate3d` + `classList` + RAF, zero Framer Motion overhead.

3. **Booklet flip** is a state machine: `sheet` (0-4) + `flipping` (null|{idx,dir}). Single-page FlipCard with `backface-visibility`.

4. **Three-stage booklet centering**: cover `x:-25%`, open `x:0%`, back-cover `x:25%`.

5. **CSS tokens in `global.css`** — all spacing/color/z-index values reference `var(--space-*)`, `var(--color-*)`, `var(--z-*)`.

6. **Book Zine mode escapes overflow** — uses `position: fixed` to break out of parent `overflow:hidden`/`overflow-y:auto` containers, enabling full-viewport horizontal scroll.

7. **Auto-discovery over manual config** — both BookView and Works use `import.meta.glob` to scan asset directories. Adding images requires zero code changes.

## Stale Files Removed

- `AudioOrb.jsx` — replaced by AudioRipples
- `AudioPlayer.jsx` — replaced by AudioTerminal → AudioRipples
- `AudioTerminal.jsx` — replaced by AudioRipples
