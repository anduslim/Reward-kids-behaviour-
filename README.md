# ⭐ Star Kids — Behaviour Rewards

A playful, **frontend-only** web app that helps parents encourage good behaviours in young
kids through stars and gamification. Kids earn **stars** (down to half a star) for good
behaviours and redeem them for **wishlist rewards**. Streaks and achievement badges keep
them motivated. All data is stored **locally in the browser** — no account, no backend.

## Features

- **Kid profiles** — name, birthday, gender, and a Kahoot-style **layered avatar builder**
  (skin, hair, eyes, mouth, glasses, background). Supports multiple children.
- **Behaviours** — add/edit good habits with an emoji or uploaded photo and a default star
  value (minimum ½ star). Seeded with common routines (brush teeth, get dressed, potty,
  eat by myself, sleep early, tidy toys, laundry, come-home routine, …).
- **Star Board** — tap a behaviour to award stars, with a fun burst animation and an
  optional custom/half-star amount.
- **Wishlist rewards** — add rewards with a photo, description, star cost, and quantity;
  kids redeem stars for them (with confetti), gated by balance and stock.
- **Achievements & streaks** — daily streaks plus milestone badges (first star, star
  collector/champion/legend, on-a-roll, week warrior, all-rounder, big spender).
- **Parent PIN gate** — a PIN protects grown-up actions (awarding, redeeming, editing).
- **Backup & restore** — export/import all data (including images) as a JSON file, since
  everything lives on the device.

## Tech

React + Vite + TypeScript + Tailwind CSS · Zustand (persisted to `localStorage`) ·
DiceBear avatars · Framer Motion + canvas-confetti · uploaded images resized and stored in
IndexedDB (`idb-keyval`).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build to dist/
npm run preview  # preview the production build
```

The app is a static site — the contents of `dist/` can be deployed to any static host
(Vercel, Netlify, GitHub Pages). Routing uses a hash router so it works without server
config.

## Data & privacy

All profiles, stars, behaviours, rewards, and history are stored in the browser
(`localStorage` + IndexedDB for images). Nothing is sent to a server. Clearing site data
erases everything — use **Settings → Export backup** to keep a copy.
