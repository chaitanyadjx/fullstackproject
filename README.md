# VERTO

A full-stack creator streaming platform — think Patreon meets Twitch. Creators run **stations**, publish videos and live streams, sell subscription **tiers** and **perks**, and earn payouts. Viewers subscribe, watch, and engage through community posts and live chat.

This is a 6th-semester Full Stack Web Development team project.

---

## Project Status

| Layer | Status |
|---|---|
| Frontend (HTML/CSS/JS) | In progress |
| Backend (Express + MongoDB) | Not yet implemented |
| API Tests (Jest + Supertest) | Written — ready to run against implementation |

---

## Repository Structure

```
project/
├── code/               # Frontend — all HTML pages
├── design itr/         # UI design iterations (scratch/prototype files)
├── documents/          # Project documentation
├── backend/            # Backend API — Express.js + MongoDB
└── README.md
```

---

## `code/` — Frontend

Pure HTML/CSS/JS. No framework. Uses Lucide Icons, GSAP (ScrollTrigger animations), and Google Fonts (Lora, Bricolage Grotesque, Plus Jakarta Sans).

```
code/
├── index.html              # Landing page
├── auth/
│   ├── sign-in.html
│   ├── sign-up.html
│   ├── forgot-password.html
│   ├── reset.html
│   └── verify-email.html
├── admin/
│   ├── dashboard.html      # Platform-wide overview (admin only)
│   ├── creators.html       # Creator application review
│   ├── bundles.html        # Bundle management
│   └── safety.html         # Reports & moderation queue
├── billing/
│   ├── billing.html        # Transaction history
│   ├── subscriptions.html  # Active subscriptions
│   ├── settings.html       # Billing preferences
│   └── notifications.html  # Billing alerts
├── community/
│   ├── community.html      # Subscriber feed
│   ├── station-forum.html  # Per-station post board
│   ├── thread.html         # Single post + comment thread
│   ├── perks.html          # Viewer perks vault
│   └── public profile.html # Public user profile
├── discovery/
│   ├── browse.html         # Explore all stations
│   ├── station.html        # Station page (tiers, videos, posts)
│   ├── watch.html          # Video player
│   ├── live.html           # Live stream player + chat
│   ├── bundle.html         # Bundle detail page
│   └── guide.html          # Onboarding guide
└── studio/
    ├── dashboard.html      # Creator earnings & stats
    ├── content.html        # Video library management
    ├── upload.html         # Upload new video
    ├── schedule.html       # Schedule live streams
    ├── tiers.html          # Subscription tier editor
    ├── payouts.html        # Payout history & withdraw
    ├── community.html      # Manage posts & comments
    └── settings.html       # Station profile settings
```

---

## `design itr/` — Design Iterations

Scratch files used during UI exploration. Not part of the production build.

```
design itr/
├── flow.html       # User flow diagram
├── itr1.html       # First layout prototype
├── itr2–10.html    # Progressive design iterations
```

---

## `documents/` — Project Documentation

```
documents/
├── Prompt.md       # Original project brief / requirements
├── task.md         # Task breakdown and assignment notes
└── routes.md       # Full API reference — all endpoints with request/response shapes
```

**`routes.md`** is the single source of truth for the API contract. It covers all 16 route modules (~100 endpoints), request body shapes, response formats, and MongoDB model summaries. Backend developers should implement against this document; test files verify conformance.

---

## `backend/` — Backend API

Express.js REST API backed by MongoDB/Mongoose. **Not yet implemented** — the folder currently contains the test suite that will verify the implementation once built.

```
backend/
├── package.json            # Dependencies + per-module test scripts
├── jest.config.js          # Jest configuration (in-memory MongoDB)
└── tests/
    ├── setup.js            # Global: starts MongoMemoryServer, sets env vars
    ├── teardown.js         # Global: stops MongoMemoryServer
    ├── helpers.js          # Shared utilities (connectDB, loginUser, loginAdmin, etc.)
    ├── auth.test.js
    ├── user.test.js
    ├── studio.test.js
    ├── videos.test.js
    ├── streams.test.js
    ├── tiers.test.js
    ├── subscriptions.test.js
    ├── payouts.test.js
    ├── discovery.test.js
    ├── bundles.test.js
    ├── community.test.js
    ├── comments.test.js
    ├── perks.test.js
    ├── notifications.test.js
    ├── billing.test.js
    └── admin.test.js
```

### Planned Stack

| Concern | Library |
|---|---|
| Server | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) |
| Password hashing | bcryptjs |
| File uploads | Multer |
| Payments | Stripe |
| Config | dotenv |

### API Conventions

- Base path: `/api/v1`
- All responses: `{ success: bool, data: any, message: string }`
- Auth: `Authorization: Bearer <accessToken>` header
- Roles: `viewer` · `creator` · `admin`

### Running Tests

Tests use `mongodb-memory-server` — no real database connection needed.

```bash
cd backend
npm install

# Run all tests
npm test

# Run a single module
npm run test:auth
npm run test:studio
npm run test:videos
# ... (one script per module — see package.json)
```

Each test file covers:
- **Happy path** — valid input returns expected status and response shape
- **Auth guard** — `401` when no token provided
- **Role guard** — `403` when wrong role attempts a protected action
- **Validation** — `400` for missing or malformed input
- **Not found** — `404` for non-existent resource IDs

---

## Team

6th Semester Full Stack Web Development — IIITDMK Project, 2025–26.
