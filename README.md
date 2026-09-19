# Sanctum

A private mental health and safety space for women who feel unsafe but can't simply leave.

Sanctum is built for the reality that asking for help can be the most dangerous moment. There are
no accounts, no sign-ups, and nothing that ties the app to the person using it. Every design
decision follows from one assumption: someone else may be looking at this device.

---

## Contents

- [What it does](#what-it-does)
- [Safety features](#safety-features)
- [Privacy model](#privacy-model)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Running it locally](#running-it-locally)
- [API](#api)
- [Testing](#testing)
- [Deployment](#deployment)
- [Disclaimer](#disclaimer)

---

## What it does

### SOS — hide a message inside an image (`/sos`)

Write a short call for help, or describe the situation in a few words and let the AI expand it into
a clear message. The text is encrypted and then hidden in the pixels of an ordinary-looking photo
using LSB steganography. Pick one of the bundled carrier images or upload your own PNG. The result
downloads as a normal image that can be sent over any chat app — it looks like a picture of a
forest, because it *is* a picture of a forest.

### Decoder — read a hidden message (`/decode`)

Drop an image in and get the message back. No session required, so a recipient can decode something
without ever touching the rest of the app.

### Therapy — a trauma-informed AI companion (`/therapy`)

A conversational space to talk through what's happening. Messages are encrypted at rest and the
conversation dies with the session. Includes a guided breathing exercise for acute moments.

### Compass — legal and practical guidance (`/legal`)

Plain-language answers about rights, protective orders, documentation, and what options exist.
Conversations can be exported to a text file with a warning attached about where to store it.

### Crisis handling

Every user message is scanned by a deterministic regex crisis detector before it reaches the model.
On a hit, emergency resources are prepended to the reply regardless of what the model produces —
the safety net never depends on the AI behaving. Emergency dispatch and support hotlines are listed
separately, so the button that says "hotline" doesn't dial 911.

---

## Safety features

These are the parts that make it usable on a monitored device.

| Feature | What it does |
|---|---|
| **Quick exit** | A configurable keyboard shortcut and always-visible button. One press erases the server session, clears local session storage, buries visited pages under ten decoy history entries, and navigates away — so pressing Back walks through decoys instead of returning to `/therapy`. |
| **Random exit destinations** | The exit lands on a different everyday site each time (Weather.com, Maps, Wikipedia, ESPN, Amazon…). Always landing on the same page is its own tell. Custom URLs supported. Destinations are landing pages, never searches — a search query persists in a signed-in account's history long after the browser's is cleared. |
| **Disguise** | Change the app's name, icon, and theme colour to look like Weather, Calculator, Notes, Recipes, Fitness, or a custom icon you build or upload. Applied in `index.html` *before first paint*, so the real name never flashes in the tab while loading. |
| **Install as an app** | PWA install flow, so the disguise carries onto the home screen as a normal-looking app icon. |
| **Incognito guidance** | Built-in, platform-aware instructions for opening a private window on the current device. |
| **Guided onboarding** | A first-visit tour that walks through the quick exit and disguise before anything else. |
| **Durable preferences** | Disguise and shortcut settings survive a quick exit on purpose — settings that reset every time they're used would be worse than none. They're stored under a neutral key (`app-preferences`) and contain no conversation content. Malformed values fall back field by field, so a corrupted value can never break the quick exit. |

---

## Privacy model

- **No accounts.** Sessions are anonymous UUIDs with a 24-hour TTL that slides on use, capped at 7
  days from creation. An hourly job hard-deletes expired sessions; expired sessions return 404
  before cleanup even runs.
- **Encrypted at rest.** AES-256-GCM with a random IV per value. Two subkeys are derived from the
  master key via HMAC-SHA256 — one for data at rest, one for SOS images. Ciphertext is bound to its
  session and column as associated data.
- **Logs reveal nothing.** One line per request with the route *template*, status, and duration —
  never the path, IP, body, or model output. A Logback turbo filter drops any log event containing a
  UUID, IP address, or email and logs a "suppressed" marker instead.
- **SOS images are clean.** Output PNGs are re-encoded from pixels only, stripping EXIF, text
  chunks, and timestamps.
- **`/sos/expand` stores nothing.** The AI expansion round-trip is never persisted.
- **Offline fallback.** If the API is unreachable, the frontend creates a local-only session rather
  than blocking access to the safety features.

---

## Tech stack

### Frontend

| | |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 3 + PostCSS, Material Symbols, Manrope |
| HTTP | Axios |
| Scrolling | Lenis (smooth scroll) |
| Linting | Oxlint |
| Testing | Vitest |

### Backend

| | |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.5 (Web, Validation, Data JPA, Actuator, Security) |
| Database | PostgreSQL + Flyway migrations |
| AI | Google Gemini (`generateContent` REST) |
| Rate limiting | Bucket4j |
| Logging | Logback + Logstash JSON encoder (prod) |
| Build | Maven (wrapper included) |
| Testing | JUnit 5, Mockito, Testcontainers, JaCoCo (80% line coverage gate on services) |
| Packaging | Distroless non-root Docker image |

---

## Project layout

```
Sanctum/
├── backend/                     Spring Boot API
│   └── src/main/java/com/sanctum/
│       ├── ai/                  AiService, GeminiAiService, CrisisDetector, PromptLibrary
│       ├── chat/                Therapy + legal chat endpoints, conversation persistence
│       ├── session/             Anonymous session lifecycle
│       ├── sos/                 SOS expand/encode/decode + LSB steganography
│       ├── crypto/              AES-256-GCM EncryptionService
│       ├── common/              Error handling, request-id filter, log scrubbing
│       ├── config/              CORS, security headers, rate limits, AI client
│       └── scheduled/           Hourly expired-session cleanup
└── frontend/                    React SPA
    └── src/
        ├── pages/               Home, Sos, Decode, Therapy, Legal, Privacy, Settings, NotFound
        ├── features/
        │   ├── quick-exit/      Shortcut, destinations, decoy history, exit logic
        │   ├── disguise/        Presets, custom icon editor, pre-paint application
        │   ├── preferences/     Device-local settings, defensive parsing
        │   ├── onboarding/      First-visit guided tour
        │   └── install/         PWA install prompt
        ├── components/          Layout, shared UI, SOS composer/carrier picker
        ├── context/             SessionContext
        ├── hooks/               useChat, useSession, useQuickExit, usePlatform, …
        └── api/                 Axios client + typed endpoint wrappers
```

---

## Running it locally

**Prerequisites:** Java 21, Node 20+, Docker (for Postgres and the integration tests).

### Backend

```bash
cd backend
cp .env.example .env          # then fill it in
docker compose up -d          # Postgres on localhost:5432
./mvnw spring-boot:run        # http://localhost:8080 (dev profile)
```

`.env` (git-ignored) needs:

- `SANCTUM_ENCRYPTION_KEY` — **required**. Generate with `openssl rand -base64 32`.
- `GEMINI_API_KEY` — from [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
  Without it, chat and SOS expand return `503`; everything else still works.

> **Keep the same `SANCTUM_ENCRYPTION_KEY` across restarts.** Stored messages and previously
> encoded SOS images can only be read with the key that wrote them.

Real environment variables override `.env`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env          # sets VITE_API_BASE_URL=http://localhost:8080
npm run dev                   # http://localhost:5173
```

### Frontend scripts

| Command | Does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check then production build |
| `npm run typecheck` | `tsc -b` only |
| `npm run lint` | Oxlint |
| `npm test` | Vitest |
| `npm run preview` | Serve the production build |

---

## API

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/sessions` (also `/api/session`) | `201 SessionResponse`. 5/min per client IP |
| `GET` | `/api/sessions/{id}` | `404 session_not_found` if unknown, expired, or malformed |
| `PATCH` | `/api/sessions/{id}` | `{ situationSummary }`; `""` clears it. Slides expiry |
| `DELETE` | `/api/sessions/{id}` | `204` always — idempotent, reveals nothing. Hard delete + cascade |
| `POST` | `/api/chat/therapy`, `/api/chat/legal` | `{ sessionId, message ≤4000 }` → `{ reply, timestamp }`. 20/min per session |
| `POST` | `/api/sos/expand` | `{ sessionId, shortInput ≤1000 }` → `{ expandedMessage }`. Nothing stored |
| `POST` | `/api/sos/encode` | multipart `sessionId`, `message`, optional `image` (PNG) |
| `POST` | `/api/sos/decode` | multipart `image` → `{ found, decodedMessage? }`. No session needed |

`/sos/encode` returns `{ imageUrl: "data:image/png;base64,…", byteSize }` by default. Send
`Accept: image/png` for the raw PNG as an attachment.

Errors are always `{ status, code, message }`. Codes: `session_not_found`, `validation_failed`,
`malformed_request`, `rate_limited` (+ `Retry-After`), `ai_unavailable` (503 — a reply is never
fabricated), `unsupported_image` (415, non-PNG by magic bytes), `payload_too_large` (>10 MB),
`image_too_large` (dimensions), `message_too_large` (doesn't fit the carrier), `corrupt_payload`
(422).

### Steganography format

LSB of R, G, B (never alpha). Payload is `["SNCT"][uint32 len][AES-GCM ciphertext]`. Capacity is
`W×H×3/8` bytes with 36 bytes of overhead. Uploads are validated by PNG signature and header
dimensions (≤ 8192 px per side, ≤ 16.7 MP) *before* decoding.

See [backend/README.md](backend/README.md) for the full design notes.

---

## Testing

```bash
cd backend && ./mvnw verify   # unit + Testcontainers integration tests + coverage gate
cd frontend && npm test       # Vitest
```

Docker must be running for the backend integration tests. The JaCoCo gate requires 80% line
coverage on service classes.

---

## Deployment

```bash
cd backend
docker build -t sanctum-backend .
```

Produces a distroless, non-root image running the `prod` profile. Required environment:
`DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`, `SANCTUM_ENCRYPTION_KEY`, `GEMINI_API_KEY`,
`SANCTUM_ALLOWED_ORIGIN`.

Run it behind TLS. The `prod` profile trusts `X-Forwarded-*` headers, so the reverse proxy must set
them.

The frontend builds to static files (`npm run build` → `dist/`) and can be served from any static
host or CDN.

---

## Disclaimer

Sanctum is not a replacement for emergency services, legal counsel, or professional mental health
care. Nothing it produces is legal or medical advice. If you are in immediate physical danger, call
your local emergency number.

No software can make a device fully safe. If someone has physical access to your phone or computer,
or has installed monitoring software on it, use a device they cannot reach.
