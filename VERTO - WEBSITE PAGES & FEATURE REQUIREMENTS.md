# VERTO - WEBSITE PAGES & FEATURE REQUIREMENTS

## TOTAL PAGE COUNT: **23 HTML Pages**

---

# SECTION 1: PAGE INVENTORY

## A. PUBLIC PAGES (12 pages)

### Marketing & Information

1. **Homepage** (`/`)
2. **About Us** (`/about`)
3. **How It Works** (`/how-it-works`)
4. **For Creators** (`/creators`)
5. **For Viewers** (`/viewers`)
6. **Pricing** (`/pricing`)
7. **Blog/News** (`/blog`)
8. **Blog Post Template** (`/blog/[slug]`)

### Legal & Support

9. **Terms of Service** (`/terms`)
10. **Privacy Policy** (`/privacy`)
11. **FAQ** (`/faq`)
12. **Contact** (`/contact`)

---

## B. AUTHENTICATION PAGES (3 pages)

13. **Login** (`/login`)
14. **Sign Up - Creator** (`/signup/creator`)
15. **Sign Up - Viewer** (`/signup/viewer`)

---

## C. CREATOR DASHBOARD (4 pages)

16. **Creator Dashboard Home** (`/creator/dashboard`)
17. **Upload Content** (`/creator/upload`)
18. **Analytics** (`/creator/analytics`)
19. **Pack Management** (`/creator/packs`)

---

## D. VIEWER PAGES (4 pages)

20. **Browse Creators** (`/browse`)
21. **Browse Packs** (`/browse/packs`)
22. **Creator Profile Page** (`/creator/[username]`)
23. **Video Player Page** (`/watch/[video-id]`)

---

# SECTION 2: DETAILED FEATURE REQUIREMENTS DOCUMENT

---

## PAGE 1: HOMEPAGE (`/`)

### Purpose

Convert visitors into creators or viewers within 10 seconds of landing.

### Key Sections

#### 1.1 Hero Section

**Features:**

- **Headline:** "Netflix for Indie Creators" (48px, bold)
- **Subheadline:** "One subscription. Multiple creators. Zero ads. You keep 85%."
- **CTA Buttons:**
  - Primary: "Start Creating" (links to `/signup/creator`)
  - Secondary: "Browse Content" (links to `/browse`)
- **Hero Visual:** Animated mockup showing:
  - Desktop app uploading video
  - Pack creation interface
  - Viewer browsing curated packs

#### 1.2 Problem Statement (3-column layout)

**Features:**

- Icon + stat callouts:
  - "45% Platform Tax" (YouTube icon)
  - "12 Subscriptions" (scattered platform logos)
  - "Ad Overload" (muted speaker icon)
- Each column links to `/how-it-works` with anchor

#### 1.3 How Verto Works (Interactive)

**Features:**

- Tab switcher: "For Creators" | "For Viewers"
- **Creator Tab:**
  - Upload → Bundle → Earn workflow diagram
  - "Keep 85-90%" badge
  - "4x Faster Uploads" badge
- **Viewer Tab:**
  - Browse → Subscribe → Curate workflow
  - "Earn 5% Referrals" badge
  - "100% Ad-Free" badge

#### 1.4 Featured Packs Carousel

**Features:**

- Horizontal scroll carousel (6-8 packs visible)
- Each pack card shows:
  - Pack thumbnail (composite of creator avatars)
  - Pack name
  - Number of creators (e.g., "5 Creators")
  - Price (e.g., "$12/month")
  - "Preview" button (modal with creator list)
- Auto-scroll every 5 seconds

#### 1.5 Creator Testimonials

**Features:**

- 3-card layout with quotes
- Each card:
  - Creator avatar
  - Quote (max 140 characters)
  - Creator name + niche
  - Revenue stat (e.g., "Earning $850/month")

#### 1.6 Stats Section

**Features:**

- 4 large numbers in a row:
  - "500+ Creators"
  - "30K+ Viewers"
  - "$2.4M Paid to Creators"
  - "85% Avg Revenue Share"

#### 1.7 Final CTA

**Features:**

- Split CTA:
  - Left: "I'm a Creator" → `/signup/creator`
  - Right: "I'm a Viewer" → `/signup/viewer`
- Background: Gradient (primary color)

---

## PAGE 2: ABOUT US (`/about`)

### Purpose

Build trust through founder story, mission, and team transparency.

### Key Sections

#### 2.1 Mission Statement

**Features:**

- Large headline: "We believe creators should own their audience"
- 3-paragraph manifesto explaining:
  - The platform tax problem
  - Why bundling unlocks creator collaboration
  - Vision for creator sovereignty

#### 2.2 Founder Story

**Features:**

- Side-by-side layout:
  - Left: Founder photo
  - Right: Story narrative (300-500 words)
- Key beats:
  - Personal experience with platform exploitation
  - "Aha moment" for P2P bundling
  - Why now is the time

#### 2.3 Team Section

**Features:**

- Grid of team members (3-4 cards)
- Each card:
  - Photo
  - Name + role
  - 1-sentence bio
  - LinkedIn icon link

#### 2.4 Values

**Features:**

- 4 value cards (icon + title + description):
  - "Creator First"
  - "Radical Transparency"
  - "Community Owned"
  - "No Ads, Ever"

---

## PAGE 3: HOW IT WORKS (`/how-it-works`)

### Purpose

Explain the platform mechanics for both creators and viewers.

### Key Sections

#### 3.1 For Creators Workflow

**Features:**

- 5-step vertical timeline:
  1. **Sign Up:** Verification process (ID check, portfolio review)
  2. **Upload:** Desktop app demo (drag-drop video)
  3. **Bundle:** Create/join Packs (UI mockup)
  4. **Schedule:** Linear TV programming (calendar view)
  5. **Earn:** Revenue dashboard (chart showing 85% split)

#### 3.2 For Viewers Workflow

**Features:**

- 4-step horizontal process:
  1. **Browse:** Discovery feed mockup
  2. **Subscribe:** Individual vs. Pack comparison
  3. **Watch:** Video player with no ads
  4. **Curate:** Create your own Pack (earn 5%)

#### 3.3 Revenue Split Visualization

**Features:**

- Interactive pie chart:
  - 85% Creators (green)
  - 10% Infrastructure (blue)
  - 5% Curators (purple)
- Tooltip on hover shows dollar amounts based on $12 subscription

#### 3.4 FAQ Accordion

**Features:**

- 8-10 common questions:
  - "How do Packs work?"
  - "What file formats are supported?"
  - "Can I leave a Pack anytime?"
  - "How do I get paid?"
- Expandable/collapsible sections

---

## PAGE 4: FOR CREATORS (`/creators`)

### Purpose

Convert content creators to sign up by showcasing benefits and tools.

### Key Sections

#### 4.1 Value Proposition

**Features:**

- Large stat callouts:
  - "Keep 85-90%" (vs. 50-55% on YouTube)
  - "4x Faster Uploads" (Go backend advantage)
  - "Instant Payments" (blockchain rails)

#### 4.2 Desktop App Showcase

**Features:**

- Animated GIF/video demo:
  - Drag-drop upload interface
  - Real-time transcoding progress
  - Metadata editing (title, description, tags)
- Download buttons: macOS | Windows | Linux

#### 4.3 Pack Collaboration Benefits

**Features:**

- Case study card:
  - "How 5 Creators Bundled to Earn $8K/month"
  - Revenue breakdown table
  - "See Pack Examples" CTA

#### 4.4 Pricing Tiers (Creator Plans)

**Features:**

- 3-column comparison table:
  - **Free:** 10 videos, 1GB, Verto branding
  - **Creator Pro ($15/mo):** Unlimited, analytics, custom branding
  - **Studio ($50/mo):** Multi-user, API, priority support
- "Start Free Trial" button

#### 4.5 Success Stories

**Features:**

- 3 creator profiles (card layout):
  - Avatar, name, niche
  - Before/After revenue stats
  - Quote about platform experience

#### 4.6 CTA

**Features:**

- "Join 500+ Creators" button → `/signup/creator`

---

## PAGE 5: FOR VIEWERS (`/viewers`)

### Purpose

Convert viewers to sign up by emphasizing value, ad-free experience, and curation economy.

### Key Sections

#### 5.1 Hero

**Features:**

- Headline: "One Subscription. Unlimited Quality Content."
- Subheadline: "No ads. No algorithms. Just creators you love."
- CTA: "Browse Packs" → `/browse/packs`

#### 5.2 Subscription Options

**Features:**

- 3 tiers (card layout):
  - **Individual Creator:** $3-8/month
  - **Packs:** $10-20/month (3-8 creators)
  - **Mega Pack:** $30/month (unlimited access)

#### 5.3 Viewer-as-Curator Explainer

**Features:**

- Infographic:
  - Step 1: Create custom Pack
  - Step 2: Share referral link
  - Step 3: Earn 5% commission
- "Start Curating" CTA (requires login)

#### 5.4 Featured Content Preview

**Features:**

- Grid of 8-12 video thumbnails
- Each thumbnail:
  - Creator avatar overlay
  - Video title
  - Duration
  - "Watch Preview" (30-sec clip, no login required)

#### 5.5 Ad-Free Guarantee

**Features:**

- Bold promise: "No ads. Ever."
- Comparison chart:
  - Verto: $0 ads
  - YouTube Premium: Still has creator sponsors
  - Netflix: Introducing ad tiers

#### 5.6 CTA

**Features:**

- "Start Watching Free" → `/signup/viewer`
- Small text: "7-day trial, cancel anytime"

---

## PAGE 6: PRICING (`/pricing`)

### Purpose

Transparent pricing for both creators and viewers.

### Key Sections

#### 6.1 Toggle Switcher

**Features:**

- Tab toggle: "For Creators" | "For Viewers"

#### 6.2 Creator Pricing Table

**Features:**

- 3 columns (same as Page 4):
  - Free, Creator Pro, Studio
- Feature comparison checkmarks
- "Most Popular" badge on Creator Pro

#### 6.3 Viewer Pricing Table

**Features:**

- 3 subscription types:
  - Individual ($3-8)
  - Packs ($10-20)
  - Mega Pack ($30)
- "Best Value" badge on Packs

#### 6.4 Fee Transparency

**Features:**

- Revenue split visualization (repeat from Page 3)
- "No hidden fees" guarantee
- Payment methods accepted (Stripe, crypto)

#### 6.5 FAQ

**Features:**

- Accordion with 5-6 pricing questions:
  - "Can I change tiers anytime?"
  - "Do you offer refunds?"
  - "What payment methods do you accept?"

---

## PAGE 7-8: BLOG (`/blog` + `/blog/[slug]`)

### Purpose

SEO content hub + thought leadership.

### PAGE 7: Blog Index (`/blog`)

#### 7.1 Featured Post

**Features:**

- Large hero card (latest post)
- Thumbnail image
- Title, excerpt, author, date
- "Read More" CTA

#### 7.2 Post Grid

**Features:**

- 3-column grid of blog cards
- Each card: thumbnail, title, excerpt, date
- Pagination (20 posts per page)

#### 7.3 Categories Sidebar

**Features:**

- Filter by:
  - Creator Tips
  - Platform Updates
  - Case Studies
  - Industry News

### PAGE 8: Blog Post Template (`/blog/[slug]`)

#### 8.1 Post Header

**Features:**

- Title (H1)
- Author name + avatar
- Publish date
- Estimated read time
- Social share buttons (Twitter, LinkedIn, Email)

#### 8.2 Content Area

**Features:**

- Markdown rendering
- Inline images (responsive)
- Code blocks (syntax highlighting)
- Callout boxes (tips, warnings)

#### 8.3 Related Posts

**Features:**

- 3 related posts (same category)
- Card layout with thumbnails

#### 8.4 Comments

**Features:**

- Disqus or native comment system
- Require login to comment

---

## PAGES 9-12: LEGAL & SUPPORT

### PAGE 9: Terms of Service (`/terms`)

**Features:**

- Standard legal layout
- Table of contents (jump links)
- Last updated date
- Sections:
  - User agreements
  - Creator terms
  - Payment terms
  - Content rights
  - Termination policy

### PAGE 10: Privacy Policy (`/privacy`)

**Features:**

- GDPR/CCPA compliant
- Sections:
  - Data collection
  - Cookie usage
  - Third-party sharing
  - User rights (data deletion)

### PAGE 11: FAQ (`/faq`)

**Features:**

- Search bar (filter questions)
- Accordion sections:
  - General
  - For Creators
  - For Viewers
  - Technical
  - Billing

### PAGE 12: Contact (`/contact`)

**Features:**

- Contact form:
  - Name, Email, Subject, Message
  - File upload (for support tickets)
- Social media links
- Email: support@verto.io
- Expected response time: "24-48 hours"

---

## PAGES 13-15: AUTHENTICATION

### PAGE 13: Login (`/login`)

#### Features:

- Email + password fields
- "Remember me" checkbox
- "Forgot password?" link
- Social login options:
  - Google OAuth
  - GitHub OAuth (for creators)
- "Don't have an account?" → Sign up links

### PAGE 14: Sign Up - Creator (`/signup/creator`)

#### Multi-Step Form (4 steps):

**Step 1: Basic Info**

- Full name
- Email
- Password (strength indicator)
- Username (availability check)

**Step 2: Creator Profile**

- Niche/category dropdown
- Bio (500 char max)
- Profile photo upload
- Social media links (optional)

**Step 3: Verification**

- Upload ID (driver's license/passport)
- Portfolio links (YouTube, Patreon, website)
- Why you want to join (text area)

**Step 4: Plan Selection**

- Choose: Free | Creator Pro | Studio
- Payment info (if paid tier)
- "Start 30-day trial" option

### PAGE 15: Sign Up - Viewer (`/signup/viewer`)

#### Simple 2-Step Form:

**Step 1: Account**

- Email
- Password
- Username

**Step 2: Preferences**

- Interests (multi-select: Tech, Finance, Fitness, etc.)
- "Skip for now" option
- "Browse Packs" CTA

---

## PAGES 16-19: CREATOR DASHBOARD

### PAGE 16: Creator Dashboard Home (`/creator/dashboard`)

#### 16.1 Overview Stats (4 cards)

**Features:**

- Total Subscribers
- Monthly Revenue
- Total Views (last 30 days)
- Pack Memberships

#### 16.2 Recent Activity Feed

**Features:**

- List of recent events:
  - New subscriber
  - Pack invitation
  - Payment received
  - Video published

#### 16.3 Quick Actions

**Features:**

- Button shortcuts:
  - Upload New Video
  - Create Pack
  - View Analytics
  - Download Desktop App

#### 16.4 Revenue Chart

**Features:**

- Line graph (last 90 days)
- Toggle: Daily | Weekly | Monthly
- Export to CSV button

---

### PAGE 17: Upload Content (`/creator/upload`)

#### 17.1 Upload Methods

**Features:**

- Tab switcher:
  - **Desktop App:** "Download app for fastest uploads"
  - **Web Upload:** Drag-drop interface (max 5GB)

#### 17.2 Video Metadata Form

**Features:**

- Title (required, 100 char max)
- Description (Markdown editor, 5000 char max)
- Thumbnail upload (16:9 ratio, 1920x1080 recommended)
- Category dropdown
- Tags (comma-separated)
- Visibility:
  - Public
  - Pack-only (select Packs)
  - Private

#### 17.3 Linear Scheduling (Optional)

**Features:**

- Toggle: "Schedule as premiere?"
- Date/time picker
- Timezone selector
- "Notify subscribers" checkbox

#### 17.4 Upload Progress

**Features:**

- Real-time progress bar
- Transcoding status (queued → processing → complete)
- Preview player (once processed)
- "Publish" vs. "Save Draft" buttons

---

### PAGE 18: Analytics (`/creator/analytics`)

#### 18.1 Date Range Selector

**Features:**

- Preset ranges: Last 7 days | 30 days | 90 days | All time
- Custom date picker

#### 18.2 Key Metrics Dashboard

**Features:**

- 6 stat cards:
  - Views
  - Watch Time
  - Subscribers Gained/Lost
  - Revenue
  - Avg View Duration
  - Engagement Rate (likes/comments per view)

#### 18.3 Top Videos Table

**Features:**

- Sortable columns:
  - Title
  - Views
  - Watch Time
  - Revenue
  - Publish Date
- "View Details" link per video

#### 18.4 Audience Demographics

**Features:**

- Charts:
  - Age distribution (bar chart)
  - Gender split (pie chart)
  - Geographic location (map view)
  - Device type (mobile vs. desktop)

#### 18.5 Traffic Sources

**Features:**

- Pie chart:
  - Direct
  - Pack discovery
  - Referral links
  - Search

---

### PAGE 19: Pack Management (`/creator/packs`)

#### 19.1 My Packs Section

**Features:**

- List of Packs creator is in:
  - Pack name
  - Number of creators
  - Monthly revenue
  - "View Details" button

#### 19.2 Create New Pack

**Features:**

- Form:
  - Pack name
  - Description
  - Pack thumbnail upload
  - Invite creators (email/username search)
  - Revenue split (% per creator, auto-calculates to 100%)
  - Price ($10-30 range)
- "Preview Pack Page" button
- "Publish Pack" CTA

#### 19.3 Pack Invitations

**Features:**

- List of pending invites:
  - Pack name
  - Invited by (creator name)
  - Proposed revenue split
  - "Accept" | "Decline" buttons

#### 19.4 Pack Performance

**Features:**

- Table per Pack:
  - Subscribers
  - Revenue (total + your share)
  - Growth rate (last 30 days)
  - Top referrers (viewer-curators)

---

## PAGES 20-23: VIEWER PAGES

### PAGE 20: Browse Creators (`/browse`)

#### 20.1 Filter Sidebar

**Features:**

- Category checkboxes:
  - Tech, Finance, Fitness, Cooking, etc.
- Sort by:
  - Newest
  - Most Subscribers
  - Most Active (uploads/week)
- Price range slider ($0-30)

#### 20.2 Creator Grid

**Features:**

- 4-column grid of creator cards
- Each card:
  - Profile photo
  - Name + username
  - Niche badge
  - Subscriber count
  - Price (if individual subscription)
  - "View Profile" button

#### 20.3 Search Bar

**Features:**

- Instant search (filters as you type)
- Search by: Name, niche, tags

#### 20.4 Pagination

**Features:**

- Load more (infinite scroll) OR
- Page numbers (1, 2, 3... 10)

---

### PAGE 21: Browse Packs (`/browse/packs`)

#### 21.1 Featured Packs Section

**Features:**

- Carousel (3-4 packs visible)
- Each pack card:
  - Pack thumbnail (composite creator avatars)
  - Pack name
  - Number of creators
  - Price
  - "View Pack" button

#### 21.2 Filter Options

**Features:**

- Category dropdown
- Sort by:
  - Most Popular
  - Best Value (price per creator)
  - Newest

#### 21.3 Pack Grid

**Features:**

- 3-column grid
- Each card shows:
  - Pack details (same as featured)
  - Creator avatars (max 5 visible, "+3 more" if >5)
  - Sample video thumbnail
  - "Preview Pack" modal button

#### 21.4 Create Your Own Pack

**Features:**

- CTA card: "Curate Your Own Pack & Earn 5%"
- Button → Opens Pack creator (requires login)

---

### PAGE 22: Creator Profile Page (`/creator/[username]`)

#### 22.1 Header Section

**Features:**

- Cover photo (optional)
- Profile photo
- Name + verified badge
- Subscriber count
- Bio (max 500 chars)
- Social links
- "Subscribe" button (if not subscribed)
  - Shows price
  - Instant checkout flow

#### 22.2 Videos Tab (default)

**Features:**

- Grid of video thumbnails (3-column)
- Each thumbnail:
  - Title
  - Duration
  - View count
  - Upload date
  - "Watch" button

#### 22.3 Packs Tab

**Features:**

- List of Packs this creator is in
- Each Pack card:
  - Pack name
  - Other creators in Pack (avatars)
  - Price
  - "View Pack" button

#### 22.4 About Tab

**Features:**

- Full bio
- Upload schedule (if creator uses linear scheduling)
- Stats:
  - Total videos
  - Total views
  - Join date

---

### PAGE 23: Video Player Page (`/watch/[video-id]`)

#### 23.1 Video Player

**Features:**

- HLS/DASH adaptive streaming
- Quality selector (4K, 1080p, 720p, 480p, auto)
- Playback speed (0.5x to 2x)
- Fullscreen toggle
- Picture-in-picture
- Keyboard shortcuts (Space = play/pause, F = fullscreen, etc.)
- No ads (guaranteed)

#### 23.2 Video Info Bar

**Features:**

- Title (H1)
- Creator name + avatar (clickable → profile)
- Upload date
- View count
- "Subscribe" button (if not subscribed)

#### 23.3 Description Section

**Features:**

- Expandable description (Markdown rendered)
- "Show More" toggle
- Tags (clickable → search by tag)

#### 23.4 Engagement Actions

**Features:**

- Like button (with count)
- Comment button (with count)
- Share button (dropdown):
  - Copy link
  - Twitter
  - LinkedIn
  - Email
- Add to Pack (if viewer is curator)

#### 23.5 Comments Section

**Features:**

- Sort by: Newest | Top
- Threaded replies (2 levels deep)
- Like comments
- Report comment (spam/abuse)
- Login required to comment

#### 23.6 Recommended Videos Sidebar

**Features:**

- 8-10 related videos (from same creator)
- Autoplay next video toggle
- If Pack subscription: Show other videos in Pack

---

# SECTION 3: TECHNICAL FEATURE REQUIREMENTS

## A. CORE INFRASTRUCTURE

### 1. Authentication System

**Features:**

- JWT-based session management
- OAuth 2.0 (Google, GitHub)
- Two-factor authentication (optional)
- Password reset via email
- Email verification required
- Role-based access control (Creator, Viewer, Admin)

### 2. Payment Processing

**Features:**

- Stripe integration (primary)
- Cryptocurrency option (Ethereum L2, Solana)
- Subscription management:
  - Auto-renewal
  - Proration on plan changes
  - Invoice generation (PDF)
- Payout system:
  - Creator payouts (monthly, via Stripe Connect)
  - Curator referral payouts (minimum $50 threshold)
  - Blockchain-based instant splits (experimental)

### 3. Video Infrastructure

**Features:**

- Upload:
  - Chunked uploads (resume on failure)
  - Max file size: 10GB (web), unlimited (desktop app)
  - Supported formats: MP4, MOV, AVI, MKV, WebM
- Transcoding:
  - Go-based pipeline (ffmpeg wrapper)
  - Output: HLS/DASH adaptive bitrate
  - Resolutions: 4K, 1080p, 720p, 480p, 360p
  - Priority queue (Studio tier gets priority)
- Storage:
  - IPFS/Arweave (P2P layer)
  - CDN fallback (BunnyCDN or Cloudflare)
  - Retention: Permanent (unless creator deletes)
- DRM (optional):
  - Widevine/FairPlay for premium content

### 4. Search & Discovery

**Features:**

- Elasticsearch backend
- Full-text search:
  - Creator names
  - Video titles/descriptions
  - Tags
- Autocomplete suggestions
- Search history (logged-in users)
- Trending algorithm:
  - Views + engagement (last 7 days)
  - Weighted by creator tier

### 5. Analytics Engine

**Features:**

- Real-time event tracking (Mixpanel or custom)
- Metrics tracked:
  - Video views (with deduplication)
  - Watch time (seconds)
  - Engagement (likes, comments, shares)
  - Traffic sources (referrer tracking)
- Creator dashboards:
  - Export to CSV
  - API access (Studio tier)
- Privacy:
  - Anonymized viewer data
  - GDPR/CCPA compliant (data deletion on request)

### 6. Notification System

**Features:**

- Email notifications:
  - New subscriber
  - Pack invitation
  - Payment received
  - Video published (to subscribers)
- In-app notifications (bell icon)
- Push notifications (mobile app, Phase 3)
- Notification preferences (user settings)

### 7. Admin Panel (Internal)

**Features:**

- Creator verification queue:
  - Review ID uploads
  - Approve/reject applications
  - Fraud detection (duplicate accounts)
- Content moderation:
  - Flagged videos review
  - DMCA takedown workflow
  - User ban/suspend
- Platform analytics:
  - Total revenue
  - Creator churn rate
  - Viewer retention
  - Server costs

---

## B. ADVANCED FEATURES

### 8. Linear Scheduling System

**Features:**

- Creator interface:
  - Drag-drop calendar (week view)
  - Recurring schedules (e.g., "Every Friday 8pm")
  - Timezone conversion
- Viewer interface:
  - "Live Now" indicator on homepage
  - Countdown timer (before premiere)
  - Notification 10 min before premiere
- Backend:
  - Cron job scheduler
  - HLS live stream simulation (pre-recorded VOD streamed as "live")

### 9. Pack System

**Features:**

- Pack creation:
  - Invite creators (email or username lookup)
  - Revenue split calculator (must total 100%)
  - Preview page before publishing
- Pack discovery:
  - Featured Packs (curated by admin)
  - Trending Packs (by subscriber growth)
- Viewer-curated Packs:
  - Public/private toggle
  - Referral link generation
  - Commission tracking dashboard

### 10. Desktop App (Wails + Go)

**Features:**

- Local video processing:
  - Thumbnail generation
  - Resolution detection
  - File validation (corrupt file detection)
- Batch uploads (queue system)
- Offline mode:
  - Save metadata drafts
  - Sync when online
- Auto-update mechanism
- Platform support: macOS, Windows, Linux

### 11. Referral Program

**Features:**

- Unique referral links (per user)
- Commission tracking:
  - 5% of subscription revenue (lifetime)
  - Minimum payout: $50
- Referral dashboard:
  - Clicks
  - Conversions
  - Earnings (pending + paid)
- Fraud detection:
  - Self-referral blocking
  - Suspicious activity flagging

### 12. Social Features

**Features:**

- Comments:
  - Threaded replies (2 levels)
  - Upvote/downvote
  - Report abuse
- Likes (on videos)
- Follow system (future):
  - Follow creators
  - Follow curators
- Activity feed (future):
  - "Creator X just uploaded Y"

---

## C. PERFORMANCE & SECURITY

### 13. Performance Optimizations

**Features:**

- CDN: Cloudflare or BunnyCDN
- Image optimization:
  - WebP conversion
  - Lazy loading
  - Responsive srcset
- Code splitting (React lazy load)
- Database indexing (Postgres):
  - Creator username
  - Video upload date
  - Pack IDs
- Caching:
  - Redis (session data, popular queries)
  - Browser cache headers

### 14. Security

**Features:**

- HTTPS everywhere (SSL certificate)
- Rate limiting:
  - API: 100 req/min per user
  - Upload: 5 GB/hour per creator
- CSRF protection
- XSS sanitization (user-generated content)
- SQL injection prevention (parameterized queries)
- Content Security Policy (CSP headers)
- DDoS protection (Cloudflare)
- Regular security audits (quarterly)

### 15. Compliance

**Features:**

- GDPR:
  - Data export (JSON)
  - Right to deletion
  - Cookie consent banner
- CCPA:
  - "Do Not Sell My Data" option
- DMCA:
  - Takedown request form
  - Counter-notification process
- Age verification:
  - 18+ content flagging
  - Age gate (if applicable)

---

## D. API (Phase 2-3)

### 16. Public API (Studio Tier Only)

**Features:**

- RESTful endpoints:
  - `GET /api/v1/videos` (list videos)
  - `POST /api/v1/videos/upload` (upload video)
  - `GET /api/v1/analytics` (view stats)
  - `POST /api/v1/packs` (create pack)
- Rate limits: 1000 req/hour
- API key management (creator dashboard)
- Webhooks:
  - Video published
  - New subscriber
  - Payment received

---

# SECTION 4: MOBILE APP (Future - Phase 3)

### 17. Mobile App Features (React Native)

**Features:**

- Video playback (offline download)
- Browse creators/packs
- Subscribe/manage subscriptions
- Notifications (push)
- Chromecast support
- Picture-in-picture
- iOS: App Store
- Android: Google Play

---

# SECTION 5: FUTURE FEATURES (Year 2-3)

### 18. Live Streaming

**Features:**

- RTMP ingest (OBS, Streamlabs)
- Live chat (WebSocket)
- Tipping during live (crypto micropayments)
- VOD archive after stream

### 19. Web3 Integration

**Features:**

- NFT badges:
  - "Founding Subscriber" badge
  - Pack curator achievements
- DAO governance:
  - Token-based voting (platform decisions)
  - Creator council elections
- Crypto wallets:
  - MetaMask integration
  - Phantom (Solana)

### 20. AI Features

**Features:**

- Auto-generated video summaries (GPT-4)
- Smart tags (computer vision on thumbnails)
- Personalized recommendations (ML model)
- Auto-captions (Whisper API)

---

# TECHNOLOGY STACK SUMMARY

| Component            | Technology                              |
| -------------------- | --------------------------------------- |
| **Frontend**         | React 18, Next.js 14, TailwindCSS       |
| **Backend**          | Go (Gin framework), Node.js (API layer) |
| **Database**         | PostgreSQL (primary), Redis (cache)     |
| **Video Processing** | ffmpeg (Go wrapper)                     |
| **Storage**          | IPFS/Arweave (P2P), BunnyCDN (fallback) |
| **Payments**         | Stripe, Ethereum L2 (Polygon/Optimism)  |
| **Authentication**   | JWT, OAuth 2.0                          |
| **Search**           | Elasticsearch                           |
| **Analytics**        | Mixpanel / Custom (Go + Postgres)       |
| **Desktop App**      | Wails (Go + React)                      |
| **Mobile App**       | React Native (Phase 3)                  |
| **Deployment**       | Docker, Kubernetes, AWS/GCP             |
| **CI/CD**            | GitHub Actions                          |

---

---

# ACCESSIBILITY (WCAG 2.1 AA)

### Requirements

- Color contrast: 4.5:1 (text), 3:1 (UI elements)
- Keyboard navigation: All interactive elements
- Screen reader support: ARIA labels
- Captions: Auto-generated (Whisper API)
- Responsive design: Mobile-first, 320px min width

---

**END OF FEATURE REQUIREMENTS DOCUMENT**

**Total Pages: 23**  
**Total Features: 100+**  
