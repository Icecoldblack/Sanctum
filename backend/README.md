# Sanctum backend

Spring Boot 3.5 / Java 21 API for Sanctum. Postgres + Flyway, Gemini for the AI endpoints.

This service handles data that can get someone killed if it leaks. It has no accounts, logs no
IPs or content, encrypts messages at rest, and hard-deletes expired sessions.

## Run locally

```bash
cd backend
docker compose up -d        # Postgres on localhost:5432
./mvnw spring-boot:run      # http://localhost:8080 (dev profile)
```

The dev profile reads `backend/.env` (git-ignored; template in `.env.example`) for
`SANCTUM_ENCRYPTION_KEY` (required, `openssl rand -base64 32`) and `GEMINI_API_KEY` (without
it, chat and SOS expand return 503). Real environment variables override `.env`.

Frontend: `cp frontend/.env.example frontend/.env` (sets `VITE_API_BASE_URL=http://localhost:8080`), then `npm run dev`.

Keep the same `SANCTUM_ENCRYPTION_KEY` across restarts. Stored messages and previously encoded
SOS images can only be read with the key that wrote them.

## Test

```bash
./mvnw verify    # unit + Testcontainers integration tests + 80% line-coverage gate on services
```

Docker must be running for the integration tests.

## API

| Method | Path | Notes |
|---|---|---|
| POST | `/api/sessions` (also `/api/session`) | 201 `SessionResponse`. 5/min per client IP |
| GET | `/api/sessions/{id}` | 404 `session_not_found` if unknown, expired, or malformed (e.g. `local-…`) |
| PATCH | `/api/sessions/{id}` | `{ situationSummary }`; `""` clears it. Slides expiry |
| DELETE | `/api/sessions/{id}` | 204, always (idempotent, reveals nothing). Hard delete + cascade |
| POST | `/api/chat/therapy`, `/api/chat/legal` | `{ sessionId, message ≤4000 }` → `{ reply, timestamp }`. 20/min per session |
| POST | `/api/sos/expand` | `{ sessionId, shortInput ≤1000 }` → `{ expandedMessage }`. Nothing stored |
| POST | `/api/sos/encode` | multipart `sessionId`, `message`, optional `image` (PNG). See below |
| POST | `/api/sos/decode` | multipart `image` → `{ found, decodedMessage? }`. No session needed |

`/encode` returns JSON `{ imageUrl: "data:image/png;base64,…", byteSize }` by default, which is
what the frontend reads. Send `Accept: image/png` to get the raw PNG as an attachment instead.

Errors are always `{ status, code, message }`. Codes: `session_not_found`, `validation_failed`,
`malformed_request`, `rate_limited` (+ `Retry-After`), `ai_unavailable` (503; no reply is ever
fabricated), `unsupported_image` (415, non-PNG by magic bytes), `payload_too_large` (upload over 10 MB),
`image_too_large` (dimensions), `message_too_large` (does not fit the carrier), `corrupt_payload` (422).

## Design notes

- **Encryption**: AES-256-GCM, random IV per value. Two subkeys are derived from
  `SANCTUM_ENCRYPTION_KEY` (HMAC-SHA256): one for data at rest, one for SOS images. At-rest
  ciphertext is bound to its session and column as associated data.
- **Steganography**: LSB of R, G, B (never alpha), payload `["SNCT"][uint32 len][AES-GCM ciphertext]`.
  Capacity is `W×H×3/8` bytes; overhead is 36 bytes. Uploads are checked by PNG signature and
  header dimensions (≤ 8192 px per side, ≤ 16.7 MP) before decoding. Output is re-encoded from
  pixels only, so EXIF, text chunks, and timestamps are stripped.
- **AI**: `AiService` interface, `GeminiAiService` implementation (REST `generateContent`, 30 s
  timeout, one retry on a dropped connection, never on timeout). Prompts live in
  `src/main/resources/prompts/`. Set `sanctum.ai.prompts-location=file:/path/` to edit them
  without a rebuild. History is capped at `max-history-turns` (20).
- **Crisis detection**: deterministic regex scan of the user's message. On a hit, emergency
  resources (`sanctum.crisis.resources`, US by default) are prepended to the reply whatever the
  model says.
- **Logging**: one line per request with the route template (`/api/sessions/{sessionId}`),
  status, and duration. It never includes the path, IP, body, or model output. A Logback turbo
  filter drops any event that contains a UUID, IP address, or email address, and logs a
  "suppressed" line in its place. Production logs are JSON.
- **Lifecycle**: 24 h TTL, sliding on PATCH and chat, capped at 7 days from creation. The
  cleanup job hard-deletes expired sessions hourly. Expired sessions already return 404 before
  cleanup runs.
- **Security**: Spring Security is used only for headers (HSTS, nosniff, `no-referrer`, strict
  CSP, frame deny), CORS (`sanctum.cors.allowed-origins`, no credentials), and locking down
  everything except `/api/**` and `/actuator/health{,/liveness,/readiness}`.

## Production

`docker build -t sanctum-backend .` produces a distroless, non-root image running the `prod`
profile. It needs `DATABASE_URL`, `DATABASE_USER`, `DATABASE_PASSWORD`,
`SANCTUM_ENCRYPTION_KEY`, `GEMINI_API_KEY`, and `SANCTUM_ALLOWED_ORIGIN`. Run it behind TLS.
The prod profile trusts `X-Forwarded-*` headers, so the proxy must set them.
