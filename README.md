# ResourceX – Smart Campus Resource Sharing & Marketplace Platform

> **Tagline:** *One Campus. Every Resource.*

ResourceX is a centralized, modern campus marketplace and resource-sharing platform engineered exclusively for university students, faculty, and academic researchers. It unifies peer-to-peer textbook exchanges, laboratory equipment lending, permitted study materials access, and smart requirement-based discovery into a transparent, circular campus ecosystem.

---

## 📁 Final Project Structure

```
ResourceX/
├── index.html                           # Landing page with hero, search, categories & featured resources
├── pages/
│   ├── login.html                       # Institutional login with role preview & demo switcher
│   ├── register.html                    # Campus registration with validation & honor code
│   ├── browse.html                      # Comprehensive catalog with filters, search, & view toggles
│   ├── resource-details.html            # Resource details, gallery, reviews & borrow/buy actions
│   ├── about.html                       # Campus mission, metrics & 4 core pillars
│   ├── how-it-works.html                # Interactive workflow guides & FAQ accordion
│   ├── contact.html                     # Campus help desk, dispute reporting & support tickets
│   ├── dashboard.html                   # Student & faculty dashboard with metrics & quick actions
│   ├── create-listing.html              # Multi-section resource listing form
│   ├── edit-listing.html                # Resource listing update & deletion interface
│   ├── my-resources.html                # Active user listing management & status filter
│   ├── requirements.html                # Academic requirement submission form
│   ├── matches.html                     # Smart rule-based requirement matches with relevance scores
│   ├── reservations.html                # Campus borrow requests, approvals & return tracking
│   ├── transactions.html                # Peer exchange history, receipts & CSV export
│   ├── wishlist.html                    # Saved academic resources and bookmarks
│   ├── notifications.html               # Real-time campus notification center
│   ├── profile.html                     # User profile, trust ratings, endorsements & security
│   ├── admin-dashboard.html             # High-level campus metrics & Chart.js visualizations
│   ├── admin-moderation.html            # Pending listing queue & reported content reviews
│   ├── admin-users.html                 # Campus account management & suspension controls
│   └── admin-analytics.html             # Equipment utilization & category demand analytics
├── css/
│   ├── variables.css                    # Design tokens, color system, typography & spacing
│   ├── global.css                       # Reset, typography, scrollbars & base styles
│   ├── layout.css                       # Header, navigation, containers & dashboard layout
│   ├── components.css                   # Buttons, cards, modals, badges, inputs & toasts
│   ├── landing.css                      # Hero, category cards, feature grid & CTA styling
│   ├── auth.css                         # Authentication split-screens & password strength meters
│   ├── marketplace.css                  # Resource cards, gallery, specs grid & filter drawer
│   ├── dashboard.css                    # Metric cards, quick actions, forms & moderation cards
│   └── responsive.css                   # Breakpoints for mobile (<480px), tablet (<992px), & desktop
├── js/
│   ├── config.js                        # App constants, API endpoints & DEMO_MODE toggle
│   ├── demo-data.js                     # Realistic sample dataset (resources, users, reservations)
│   ├── api.js                           # Unified service layer (switches between demo & Spring Boot)
│   ├── common.js                        # Utilities: Theme, Toast, Modal, Auth, Navigation & Sidebar
│   ├── google-auth.js                   # Google Sign-In & GIS Account Chooser integration
│   ├── landing.js                       # Landing page featured loader & quick search
│   ├── browse.js                        # Catalog search, debounced filtering, & pagination
│   ├── resource-details.js              # Details rendering, dynamic borrow/buy modals & reviews
│   ├── create-listing.js                # Dynamic listing form, image previews & validation
│   ├── dashboard.js                     # Metrics counter, reservation feed & listing previews
│   ├── requirements.js                  # Requirement posting controller
│   ├── matching.js                      # Transparent rule-based relevance matching engine
│   ├── reservations.js                  # Status state machine (Approve, Reject, Borrow, Return)
│   ├── transactions.js                  # Historical transaction table, receipt modal & CSV export
│   ├── wishlist.js                      # Wishlist state persistence & card management
│   ├── notifications.js                 # Unread counter, categorization & mark-as-read
│   ├── profile.js                       # Avatar photo upload preview & profile management
│   └── admin.js                         # Admin console, moderation queues, & Chart.js charts
├── .gitignore                           # Git ignore rules
└── README.md                            # Complete documentation & developer guide
```

---

## 🚀 Key Features Implemented

1. **Four Core Pillars of ResourceX:**
   - **Unified Resource Platform:** Catalog for physical apparatus, textbooks, electronics, and digital files.
   - **Smart Discovery:** Fast catalog search and automated rule-based requirement matching.
   - **Better Resource Utilization:** Peer borrowing schedules, return dates, and circular economy tracking.
   - **Collaborative Campus Community:** Verified institutional identity, ratings, reviews, and safe campus handover points.

2. **Google Single Sign-On (SSO):**
   - "Continue with Google" buttons on both Login and Registration pages adhering to Google Identity guidelines.
   - Integration with Google Identity Services (GIS) via `GOOGLE_CLIENT_ID`.
   - Interactive, responsive Google Account Chooser fallback for instant local testing and offline simulation without configuration hurdles.
   - Backend endpoint `POST /api/auth/google` supporting JWT credential token verification and seamless auto-registration.

3. **Clean Frontend Architecture:**
   - Built strictly with standard **HTML5**, **CSS3**, and **Vanilla JavaScript (ES6+)**.
   - Zero framework dependencies (no React, Angular, Vue, or Node.js).
   - Unified `API` service layer designed for frictionless future connection to a Java Spring Boot REST API and MongoDB database.

3. **Design System & Aesthetics:**
   - Light & Dark mode support with persistent user preference in `localStorage`.
   - Rich campus palette: Deep navy primary (`#1e3a8a` / `#0f172a`), teal accent (`#0d9488`), and semantic feedback colors.
   - Reusable component library: Toasts, Modals, Skeleton loaders, Dropdowns, Metric cards, and Badge indicators.

4. **Rule-Based Matching Simulation (`js/matching.js`):**
   - Ranks resources against posted student requirements using keyword overlap, category taxonomy, and exchange preferences.
   - Explains *why* an item matched with relevance percentages and transparent criteria tags.

5. **Campus Administration & Analytics:**
   - Interactive Chart.js charts displaying category breakdowns, circulation trends, and department demand.
   - Moderation workflows for approving new submissions and inspecting reported content.
   - User account status management with suspend/reactivate simulation.

---

## 💻 How to Run the Frontend Locally

Since ResourceX is built with static web technologies, it can be served using any local HTTP web server.

### Option 1: Python 3 (Recommended)
Open a terminal in the project directory and run:
```bash
python -m http.server 3000
```
Then navigate to: **`http://localhost:3000/index.html`**

### Option 2: Node.js `npx serve`
```bash
npx serve -l 3000 .
```

### Option 3: VS Code / IDE Live Server
Right-click on `index.html` and select **"Open with Live Server"**.

---

## 🔌 How to Switch from Demo Mode to Java Spring Boot API Mode

The application is architected so that the entire frontend data layer connects through `js/api.js`.

To connect to your live Spring Boot backend:

1. Open `js/config.js`.
2. Locate the `CONFIG` object:
   ```javascript
   const CONFIG = {
     APP_NAME: 'ResourceX',
     API_BASE_URL: 'http://localhost:8080/api', // Point to your Spring Boot server
     DEMO_MODE: false, // Change from true to false
     ...
   };
   ```
3. Set `DEMO_MODE: false`.
4. The `API` module will automatically send standard JSON `fetch()` requests with JWT authentication headers (`Authorization: Bearer <token>`) to `http://localhost:8080/api/resources`, `http://localhost:8080/api/auth`, `http://localhost:8080/api/reservations`, etc.

---

## 🧪 Tests Performed & Actual Results

An automated verification test was executed across all 23 HTML pages and 17 JavaScript modules:

| Test Case | Scope | Result | Details |
|---|---|---|---|
| **HTTP Status 200** | All 23 Pages | **PASS** | Every page loads with HTTP 200 OK via local server. |
| **Asset Link Integrity** | CSS & JS references | **PASS** | 0 broken stylesheet links; 0 missing JavaScript script files. |
| **Theme Toggle** | Light / Dark modes | **PASS** | Dynamically toggles `data-theme` attribute and updates icons. |
| **Search & Filter** | `pages/browse.html` | **PASS** | Real-time debounced search, category filters, and mode toggles. |
| **Dynamic Form State** | `pages/create-listing.html` | **PASS** | Fields show/hide correctly for physical vs. digital & free vs. sell. |
| **Smart Matching** | `pages/matches.html` | **PASS** | Rule engine computes score and reasons based on requirement criteria. |
| **Reservation Workflow** | `pages/reservations.html` | **PASS** | Status transitions (Pending → Approved → Active → Returned) succeed. |
| **Chart Visualizations** | `pages/admin-analytics.html` | **PASS** | Chart.js renders doughnut, pie, line, and bar graphs cleanly. |

---

## ⚠️ Remaining Limitations (Frontend-Only Phase)

- **Simulated Authentication:** In Demo Mode, credentials are verified against demo records in `js/demo-data.js` and stored in `sessionStorage`. True password encryption and JWT verification will be enforced when connected to the Spring Boot security filter chain.
- **Local File Uploads:** Uploaded images and digital documents use `FileReader` data URLs in memory; real file storage (e.g. AWS S3 or GridFS) will be managed by the Spring Boot backend.
- **Data Persistence:** Mutations (e.g., adding listings, approving reservations) persist during the browser session via `localStorage` and `sessionStorage`, but will reset if browser storage is cleared until connected to MongoDB.
