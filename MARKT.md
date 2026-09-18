# MamaPedia Markt v1 (locked 2026-09-17)

Shared between **Netlify** (`mamapedia.netlify.app` / GitHub `TiNa18922/mamapedia`) and **mamapedia-chat** (`https://mamapedia-chat.golightly2004.workers.dev`, Origin `yueli/tmp-e04205e25fc3c0ca`).

## Rules
- Encyclopedia chat stays homepage; Markt is secondary.
- No payments / no VIP.
- Incomplete listings must not be stored or shown.
- Deal via email (required) + optional WhatsApp.

## Types
`sell` | `swap` | `free`

## Required fields
All: `type`, `name`, `category`, `condition`, `stadtteil`, `contactEmail`  
+ by type: `priceEur` (sell) | `swapWanted` (swap) | `pickup` (free)

Optional: `description`, `whatsapp`, `photoUrl`, `emoji`

## API (on mamapedia-chat worker)

Base: `https://mamapedia-chat.golightly2004.workers.dev`

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/markt` | List active listings |
| `GET` | `/markt/:id` | Detail + contact |
| `POST` | `/markt` | Create listing (JSON body = shared schema). **400** if incomplete. |
| `OPTIONS` | `/markt` | CORS preflight |

CORS: `mamapedia.netlify.app`, localhost.

This Netlify app (this repo) loads Markt from `GET /markt` and publishes with `POST /markt` using the locked fields in `data/markt_schema_v1.json`. If the API is unreachable, it falls back to local `marktplatz_data.json` and shows a short offline note. Client-side validation runs before POST; server `400` (and other error payloads) are shown in the publish panel.

### Request / response contract
- **GET `/markt`** — JSON list of active listings. The Netlify client accepts a raw array or `{ "posts" | "listings" | "items" | "data": [...] }`.
- **GET `/markt/:id`** — one listing including `contactEmail` and optional `whatsapp`.
- **POST `/markt`** — JSON body with the shared fields (`type`, `name`, `category`, `condition`, `stadtteil`, `contactEmail`, plus `priceEur` / `swapWanted` / `pickup` by type). Optional: `description`, `whatsapp`, `photoUrl`, `emoji`. Expected success payload may wrap the created row as `{ "post": {...} }` or `{ "listing": {...} }`.

See `data/markt_schema_v1.json` for full field definitions.

## Netlify deploy
Push / merge to `main` on `TiNa18922/mamapedia`. The site at https://mamapedia.netlify.app is served from this GitHub repo (no extra Netlify build command; `index.html` is the app).
