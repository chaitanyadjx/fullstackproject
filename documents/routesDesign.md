# Requirment Analysis Document





This is the final routing and page architecture for **Verto**, organized by user persona. Since you're building with **Node.js, HTML/CSS, and JS**, these routes follow a RESTful structure where the backend serves specific views based on the session's `role_id`.

* * *

1. Public Routes (The Guest)

----------------------------

_Goal: Conversion and Trust._

| **Route**  | **Page**         | **Purpose**                                                                                  |
| ---------- | ---------------- | -------------------------------------------------------------------------------------------- |
| `/`        | **Landing Page** | The "No-Ads" manifesto. High-impact video loops and "Genre Pack" previews.                   |
| `/explore` | **Marketplace**  | A non-logged-in version of the home feed to browse verified organizations.                   |
| `/pricing` | **The Mall**     | Comparison of individual "Stations" vs. "Genre Packs."                                       |
| `/auth`    | **Gateway**      | Unified Login/Sign-up. Logic: `POST /login` $\rightarrow$ Check Role $\rightarrow$ Redirect. |

* * *

2. Viewer Routes (The Consumer)

-------------------------------

_Inspiration: Netflix-style UI, YouTube-style discovery._

### **Discovery & Home**

* **`/home` (Discovery Feed):** The main entry point.
  
  * _Features:_ "Trending in [My Pack]," "Continue Watching," and "Airing Now" linear previews.

* **`/search` (Vibe Search):** Semantic search results page.
  
  * _Features:_ Filtering by Org, Pack, or specific timestamps within videos.

### **Consumption (The "Substance")**

* **`/station/:handle` (The Channel):** The dedicated space for an Organization.
  
  * _Structure:_ Large hero player (Linear Stream) + Library tabs.

* **`/watch/:video_id` (Video Player):** Focused, cinematic viewing.
  
  * _Background:_ The **Pulse Engine** starts sending 10s heartbeats to `/api/pulse`.

### **User Identity & Management**

* **`/me/activity` (Growth Tracker):** * _Features:_ GitHub-style Heatmap of minutes watched and certifications earned.

* **`/me/billing` (Transparency Portal):**
  
  * _Features:_ Manage Stripe subscriptions and view the "Revenue Split" pie chart.

* * *

3. Organization Routes (The Creator)

------------------------------------

_Inspiration: YouTube Studio-style utility, Professional Compliance._

### **Onboarding & Trust**

* **`/verify/start` (Compliance Gate):** Multi-step form for KYC and legal ID submission.

* **`/verify/status` (Audit Tracker):** Real-time feedback on "Quality Audit" results for test uploads.

### **The Studio (Management)**

* **`/studio/dashboard` (Stats):** High-level view of current "Live" viewers and "Monthly Revenue Share."

* **`/studio/content` (Library Manager):** Grid of all VODs.

* **`/studio/scheduler` (Linear Programming):**
  
  * _Structure:_ A 24-hour drag-and-drop timeline to program the "Ghost Stream."

* **`/studio/upload` (Ingest Portal):**
  
  * _Structure:_ Large drag-and-drop area with a Node.js-powered transcoding progress bar.

* * *

4. Admin/Internal Routes (The Platform Gatekeepers)

---------------------------------------------------

_Goal: Maintaining the Verto Standard._

| **Route**           | **Page**           | **Purpose**                                                      |
| ------------------- | ------------------ | ---------------------------------------------------------------- |
| `/admin/queue`      | **Audit Queue**    | View pending Org applications and AI-flagged videos.             |
| `/admin/packs`      | **Bundle Manager** | Create, edit, or adjust the pricing of "Genre Packs."            |
| `/admin/settlement` | **Payout Ledger**  | Monthly trigger to move money from "Subscription Pools" to Orgs. |


