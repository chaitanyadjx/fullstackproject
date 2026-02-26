# VERTO — Express.js API Routes Reference

> **Stack:** Express.js · MongoDB (Mongoose)  
> **Base URL:** `/api/v1`  
> **Auth:** JWT Bearer Token unless marked `[Public]`  
> **Convention:** `{ success, data, message }` response wrapper

---

## Table of Contents
1. [Auth](#1-auth)
2. [User / Account](#2-user--account)
3. [Studio (Creator)](#3-studio-creator)
4. [Content / Videos](#4-content--videos)
5. [Live Streams & Schedule](#5-live-streams--schedule)
6. [Tiers (Membership)](#6-tiers-membership)
7. [Subscriptions](#7-subscriptions)
8. [Payouts](#8-payouts)
9. [Discovery / Browse](#9-discovery--browse)
10. [Bundles](#10-bundles)
11. [Community / Posts](#11-community--posts)
12. [Comments & Threads](#12-comments--threads)
13. [Perks (Digital Assets)](#13-perks-digital-assets)
14. [Notifications](#14-notifications)
15. [Billing / Payments](#15-billing--payments)
16. [Admin](#16-admin)
17. [MongoDB Models Summary](#17-mongodb-models-summary)

---

## 1. Auth

> Pages: `auth/sign-in.html`, `auth/sign-up.html`, `auth/forgot-password.html`, `auth/reset.html`, `auth/verify-email.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/auth/register` | Create new user account | Public |
| POST | `/auth/login` | Sign in, returns JWT | Public |
| POST | `/auth/logout` | Invalidate refresh token | ✓ |
| POST | `/auth/forgot-password` | Send password reset email | Public |
| POST | `/auth/verify-reset-token` | Validate token from email link | Public |
| POST | `/auth/reset-password` | Set new password using token | Public |
| POST | `/auth/verify-email` | Confirm email via token | Public |
| POST | `/auth/resend-verification` | Resend verification email | Public |
| GET  | `/auth/me` | Get current logged-in user | ✓ |

### Request / Response Details

**`POST /auth/register`**
```json
// Body
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "Min8chars!"
}
// Response 201
{
  "success": true,
  "message": "Account created. Check your email to verify.",
  "data": { "userId": "..." }
}
```

**`POST /auth/login`**
```json
// Body
{ "email": "jane@example.com", "password": "Min8chars!" }
// Response 200
{
  "success": true,
  "data": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "user": { "_id", "fullName", "email", "role", "avatarUrl" }
  }
}
```

**`POST /auth/forgot-password`**
```json
// Body
{ "email": "jane@example.com" }
// Response 200
{ "success": true, "message": "Reset link sent if account exists." }
```

**`POST /auth/reset-password`**
```json
// Body
{ "token": "...", "newPassword": "NewPass1!", "confirmPassword": "NewPass1!" }
// Response 200
{ "success": true, "message": "Password updated. Please sign in." }
```

---

## 2. User / Account

> Pages: `billing/settings.html`, `billing/notifications.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/users/me` | Get own profile | ✓ |
| PUT    | `/users/me` | Update display name, bio, email | ✓ |
| PUT    | `/users/me/avatar` | Upload/change profile photo | ✓ |
| PUT    | `/users/me/password` | Change password (requires current) | ✓ |
| GET    | `/users/me/notifications/settings` | Get notification preferences | ✓ |
| PUT    | `/users/me/notifications/settings` | Update notification preferences | ✓ |
| GET    | `/users/:username` | Get public profile of any user | Public |

### Request / Response Details

**`PUT /users/me`**
```json
// Body
{
  "displayName": "Alex Runner",
  "bio": "Just a viewer enjoying indie film.",
  "email": "alex@example.com"
}
// Response 200
{ "success": true, "data": { /* updated user doc */ } }
```

**`PUT /users/me/avatar`**
```
// Multipart form-data
avatar: <file>
// Response 200
{ "success": true, "data": { "avatarUrl": "https://..." } }
```

**`PUT /users/me/notifications/settings`**
```json
// Body
{
  "newContentAlerts": true,
  "communityReplies": true,
  "exclusivePerks": true,
  "weeklyDigest": true,
  "billingReceipts": true,
  "productUpdates": false
}
```

---

## 3. Studio (Creator)

> Pages: `studio/dashboard.html`, `studio/settings.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/studio/me` | Creator's own station profile | ✓ Creator |
| PUT    | `/studio/me` | Update station name, bio, avatar, banner | ✓ Creator |
| GET    | `/studio/me/stats` | Dashboard metrics (revenue, subs, watch time, retention) | ✓ Creator |
| PUT    | `/studio/me/stream-key` | Regenerate RTMP stream key | ✓ Creator |
| POST   | `/studio/apply` | Apply to become a creator | ✓ |

### Request / Response Details

**`GET /studio/me/stats`**
```json
// Response 200
{
  "success": true,
  "data": {
    "revenue30d": 3240,
    "revenueChange": 12,
    "activeSubscribers": 842,
    "newSubscribers": 54,
    "watchTimeHours": 12500,
    "avgRetentionPct": 64,
    "recentUploads": [ /* last 5 video docs */ ]
  }
}
```

**`PUT /studio/me`**
```json
// Body
{
  "displayName": "RetroTech",
  "bio": "Restoring vintage computers...",
  "category": "Technology"
}
// + optional multipart: avatarFile, bannerFile
```

**`POST /studio/apply`**
```json
// Body
{
  "stationName": "ByteSizedCode",
  "category": "Technology",
  "portfolioUrl": "https://...",
  "description": "Short-form coding tips."
}
```

---

## 4. Content / Videos

> Pages: `studio/content.html`, `studio/upload.html`, `discovery/watch.html`, `discovery/station.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/videos` | Browse/search all public videos | Public |
| GET    | `/videos/:videoId` | Get single video details | Public / ✓ |
| GET    | `/studio/me/videos` | Creator's own content library | ✓ Creator |
| POST   | `/studio/me/videos` | Upload new video (multipart) | ✓ Creator |
| PUT    | `/studio/me/videos/:videoId` | Edit title, desc, visibility, thumbnail | ✓ Creator |
| DELETE | `/studio/me/videos/:videoId` | Delete video | ✓ Creator |
| POST   | `/videos/:videoId/view` | Record a view event | ✓ |
| POST   | `/videos/:videoId/like` | Toggle like on a video | ✓ |

### Request / Response Details

**`POST /studio/me/videos`**
```
// Multipart form-data
videoFile:   <file>
thumbnail:   <file> (optional)
title:       "Restoring a 1984 Macintosh"
description: "A deep dive into CRT repairs..."
visibility:  "public" | "members_only" | "private" | "unlisted"
```
```json
// Response 201
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "...",
    "videoUrl": "https://cdn.verto.tv/...",
    "status": "processing",
    "visibility": "private"
  }
}
```

**`PUT /studio/me/videos/:videoId`**
```json
// Body (all optional)
{
  "title": "Updated Title",
  "description": "...",
  "visibility": "public",
  "publishedAt": "2026-03-01T10:00:00Z"
}
```

**`GET /studio/me/videos`**  
Query params: `?filter=all|live|shorts|drafts&page=1&limit=20`
```json
// Response 200
{
  "success": true,
  "data": {
    "videos": [
      { "_id", "title", "description", "thumbnailUrl", "visibility",
        "views", "commentCount", "createdAt", "status" }
    ],
    "total": 42,
    "page": 1
  }
}
```

---

## 5. Live Streams & Schedule

> Pages: `studio/schedule.html`, `discovery/live.html`, `discovery/guide.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/streams/live` | All currently live streams | Public |
| GET    | `/streams/:streamId` | Single live stream data + viewer count | Public |
| GET    | `/studio/me/schedule` | Creator's scheduled events | ✓ Creator |
| POST   | `/studio/me/schedule` | Create a scheduled stream event | ✓ Creator |
| PUT    | `/studio/me/schedule/:eventId` | Edit a scheduled event | ✓ Creator |
| DELETE | `/studio/me/schedule/:eventId` | Cancel/delete event | ✓ Creator |
| POST   | `/streams/:streamId/chat` | Send a chat message | ✓ |
| GET    | `/streams/:streamId/chat` | Fetch recent chat messages | ✓ |

### Request / Response Details

**`POST /studio/me/schedule`**
```json
// Body
{
  "title": "Retro Hardware Repair + Q&A",
  "scheduledAt": "2026-02-27T18:00:00Z",
  "type": "live" | "subscriber_chat",
  "description": "Optional description"
}
```

**`GET /streams/live`**
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id", "title", "stationName", "thumbnailUrl",
      "viewerCount": 1200, "tags": ["Music", "Production"]
    }
  ]
}
```

---

## 6. Tiers (Membership)

> Pages: `studio/tiers.html`, `discovery/station.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/stations/:stationId/tiers` | Get all tiers for a station | Public |
| GET    | `/studio/me/tiers` | Creator's own tiers | ✓ Creator |
| POST   | `/studio/me/tiers` | Create a new membership tier | ✓ Creator |
| PUT    | `/studio/me/tiers/:tierId` | Edit tier name, price, perks | ✓ Creator |
| DELETE | `/studio/me/tiers/:tierId` | Delete a tier | ✓ Creator |
| PUT    | `/studio/me/tiers/active` | Toggle memberships on/off | ✓ Creator |

### Request / Response Details

**`POST /studio/me/tiers`**
```json
// Body
{
  "name": "Super Fan",
  "price": 9.99,
  "description": "Get exclusive behind the scenes.",
  "perks": ["All Supporter Perks", "Exclusive VODs", "Early Access to Videos"]
}
// Response 201
{ "success": true, "data": { "_id", "name", "price", "perks", "subscriberCount" } }
```

**`GET /stations/:stationId/tiers`**
```json
// Response 200
{
  "success": true,
  "data": [
    { "_id", "name", "price", "description", "perks": [], "subscriberCount" }
  ]
}
```

---

## 7. Subscriptions

> Pages: `billing/subscriptions.html`, `discovery/station.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/users/me/subscriptions` | All of user's active/canceled subs | ✓ |
| POST   | `/subscriptions` | Subscribe to a tier (triggers payment) | ✓ |
| PUT    | `/subscriptions/:subId/cancel` | Cancel a subscription | ✓ |
| PUT    | `/subscriptions/:subId/reactivate` | Reactivate a canceled sub | ✓ |
| GET    | `/subscriptions/:subId` | Get single subscription details | ✓ |

### Request / Response Details

**`POST /subscriptions`**
```json
// Body
{
  "tierId": "...",
  "stationId": "...",
  "paymentMethodId": "pm_stripe_..."
}
// Response 201
{
  "success": true,
  "data": {
    "_id", "status": "active",
    "tier": { "name", "price" },
    "station": { "name", "avatarUrl" },
    "nextBillingDate": "2026-03-15"
  }
}
```

**`GET /users/me/subscriptions`**
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id", "status": "active" | "canceled",
      "tier": { "name", "price" },
      "station": { "name", "coverUrl", "avatarUrl" },
      "nextBillingDate": "2026-03-15"
    }
  ]
}
```

---

## 8. Payouts

> Pages: `studio/payouts.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/studio/me/payouts` | Payout history + current balance | ✓ Creator |
| POST   | `/studio/me/payouts/withdraw` | Request a payout withdrawal | ✓ Creator |
| GET    | `/studio/me/payouts/:payoutId` | Single payout transaction details | ✓ Creator |

### Request / Response Details

**`GET /studio/me/payouts`**
```json
// Response 200
{
  "success": true,
  "data": {
    "balance": 1245.80,
    "history": [
      {
        "_id", "transactionId": "TX_882910AA",
        "method": "Bank Transfer (**** 4421)",
        "amount": 2100.00,
        "status": "paid",
        "paidAt": "2024-10-01"
      }
    ]
  }
}
```

**`POST /studio/me/payouts/withdraw`**
```json
// Body
{ "amount": 1245.80 }
// Response 201
{ "success": true, "data": { "transactionId": "TX_...", "status": "processing" } }
```

---

## 9. Discovery / Browse

> Pages: `discovery/browse.html`, `discovery/station.html`, `discovery/guide.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/stations` | Browse/search all stations | Public |
| GET    | `/stations/:stationId` | Single station profile + videos | Public |
| GET    | `/stations/:stationId/videos` | Paginated video list for station | Public |
| GET    | `/discover/categories` | Get all content categories | Public |
| GET    | `/discover/featured` | Featured/recommended stations | Public |

### Request / Response Details

**`GET /stations`**  
Query params: `?search=retro&category=Technology&page=1&limit=20`
```json
// Response 200
{
  "success": true,
  "data": {
    "stations": [
      {
        "_id", "name", "bannerUrl", "avatarUrl",
        "tags": ["Technology", "History"],
        "subscriberCount": 52200,
        "isLive": false
      }
    ],
    "total": 150, "page": 1
  }
}
```

**`GET /stations/:stationId`**
```json
// Response 200
{
  "success": true,
  "data": {
    "_id", "name", "bio", "bannerUrl", "avatarUrl",
    "tags": [], "subscriberCount": 52200,
    "tiers": [ /* tier docs */ ],
    "isLive": false,
    "latestVideos": [ /* last 8 video docs */ ]
  }
}
```

---

## 10. Bundles

> Pages: `discovery/bundle.html`, `discovery/browse.html`, `admin/bundles.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/bundles` | List all public bundles | Public |
| GET    | `/bundles/:bundleId` | Single bundle with included stations | Public |
| POST   | `/bundles` | Create a new bundle | ✓ Admin |
| PUT    | `/bundles/:bundleId` | Edit bundle details | ✓ Admin |
| DELETE | `/bundles/:bundleId` | Delete a bundle | ✓ Admin |
| POST   | `/subscriptions/bundle` | Subscribe to a bundle | ✓ |

### Request / Response Details

**`POST /bundles`** *(Admin only)*
```json
// Body
{
  "name": "The Tech Stack",
  "price": 14.99,
  "description": "8 premium technology channels included.",
  "stationIds": ["id1", "id2", "id3"],
  "isFeatured": true
}
```

**`POST /subscriptions/bundle`**
```json
// Body
{ "bundleId": "...", "paymentMethodId": "pm_stripe_..." }
// Response 201
{ "success": true, "data": { "_id", "status": "active", "bundle": { "name", "price" } } }
```

---

## 11. Community / Posts

> Pages: `community/community.html`, `community/station-forum.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/community/feed` | Aggregated feed from subscribed stations | ✓ |
| GET    | `/stations/:stationId/posts` | Posts for a specific station's forum | ✓ |
| POST   | `/stations/:stationId/posts` | Create a new post (creator or member) | ✓ |
| PUT    | `/posts/:postId` | Edit a post (own only) | ✓ |
| DELETE | `/posts/:postId` | Delete a post | ✓ |
| POST   | `/posts/:postId/like` | Toggle like on a post | ✓ |

### Request / Response Details

**`POST /stations/:stationId/posts`**
```json
// Body
{
  "title": "First look at the new collection dropping Friday!",
  "body": "We've been working on this for months...",
  "imageUrl": "https://..." // optional
}
// Response 201
{ "success": true, "data": { "_id", "title", "body", "author", "createdAt", "likeCount": 0 } }
```

**`GET /community/feed`**  
Query params: `?page=1&limit=20`
```json
// Response 200
{
  "success": true,
  "data": {
    "posts": [
      {
        "_id", "title", "body", "imageUrl",
        "author": { "name", "avatarUrl", "role": "creator" | "member" },
        "station": { "name", "avatarUrl" },
        "likeCount": 1200, "commentCount": 234,
        "createdAt": "..."
      }
    ]
  }
}
```

---

## 12. Comments & Threads

> Pages: `community/thread.html`, `studio/community.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/posts/:postId/comments` | Get comments for a post (threaded) | ✓ |
| POST   | `/posts/:postId/comments` | Add a comment to a post | ✓ |
| POST   | `/comments/:commentId/reply` | Reply to a comment (nested) | ✓ |
| DELETE | `/comments/:commentId` | Delete a comment | ✓ |
| POST   | `/comments/:commentId/like` | Toggle upvote on a comment | ✓ |
| GET    | `/videos/:videoId/comments` | Get comments on a video | ✓ |
| POST   | `/videos/:videoId/comments` | Post a comment on a video | ✓ |
| GET    | `/studio/me/comments` | All comments across creator's content | ✓ Creator |
| DELETE | `/studio/me/comments/:commentId` | Remove a comment from own content | ✓ Creator |
| PUT    | `/studio/me/comments/:commentId/approve` | Approve a held comment | ✓ Creator |
| PUT    | `/studio/me/comments/:commentId/ban-user` | Ban a commenter from the station | ✓ Creator |

### Request / Response Details

**`POST /posts/:postId/comments`**
```json
// Body
{ "text": "Pretty sure it's a custom shader." }
// Response 201
{
  "success": true,
  "data": { "_id", "text", "author": { "name", "avatarUrl" }, "isOP": false, "likeCount": 0, "createdAt": "..." }
}
```

**`GET /studio/me/comments`**  
Query params: `?filter=all|held|flagged&page=1&limit=30`
```json
// Response 200
{
  "success": true,
  "data": {
    "comments": [
      {
        "_id", "text", "status": "approved" | "held" | "flagged",
        "author": { "name", "avatarUrl" },
        "contentRef": { "type": "video" | "post", "title": "..." },
        "createdAt": "..."
      }
    ]
  }
}
```

---

## 13. Perks (Digital Assets)

> Pages: `community/perks.html`, `studio/tiers.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/users/me/perks` | All perks available to the user | ✓ |
| GET    | `/studio/me/perks` | Creator's uploaded perk assets | ✓ Creator |
| POST   | `/studio/me/perks` | Upload a new perk (file + metadata) | ✓ Creator |
| DELETE | `/studio/me/perks/:perkId` | Remove a perk | ✓ Creator |
| POST   | `/perks/:perkId/claim` | Claim/download a perk | ✓ |

### Request / Response Details

**`POST /studio/me/perks`**
```
// Multipart form-data
assetFile:    <file> (.zip, .wav, .vsix, etc.)
title:        "4K Wallpaper Pack Vol. 2"
description:  "A collection of 10 high-res desktop backgrounds..."
requiredTier: "tierId" | "any"
stationId:    "..."
```

**`GET /users/me/perks`**
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id", "title", "description",
      "station": { "name" },
      "assetType": "zip" | "audio" | "theme",
      "claimed": false,
      "downloadUrl": null  // populated if claimed = true
    }
  ]
}
```

---

## 14. Notifications

> Pages: `billing/notifications.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/users/me/notifications` | Paginated inbox of notifications | ✓ |
| PUT    | `/users/me/notifications/:notifId/read` | Mark one notification as read | ✓ |
| PUT    | `/users/me/notifications/read-all` | Mark all as read | ✓ |

### Request / Response Details

**`GET /users/me/notifications`**
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id", "type": "new_content" | "comment_reply" | "new_perk" | "billing",
      "message": "Retro Tech just uploaded a new video.",
      "link": "/discovery/watch?id=...",
      "read": false,
      "createdAt": "..."
    }
  ]
}
```

---

## 15. Billing / Payments

> Pages: `billing/billing.html`

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/billing/transactions` | Full transaction history | ✓ |
| GET    | `/billing/transactions/:txId/invoice` | Download invoice PDF | ✓ |
| GET    | `/billing/payment-methods` | List saved payment methods | ✓ |
| POST   | `/billing/payment-methods` | Add a new payment method (Stripe token) | ✓ |
| DELETE | `/billing/payment-methods/:pmId` | Remove a payment method | ✓ |
| PUT    | `/billing/payment-methods/:pmId/primary` | Set as primary payment method | ✓ |

### Request / Response Details

**`GET /billing/transactions`**
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id", "date": "2026-02-15",
      "description": "Elena Vasquez Docs - Monthly",
      "amount": 5.00,
      "status": "paid",
      "invoiceId": "..."
    }
  ]
}
```

**`POST /billing/payment-methods`**
```json
// Body
{ "stripePaymentMethodId": "pm_..." }
// Response 201
{ "success": true, "data": { "_id", "brand": "visa", "last4": "4242", "expMonth": 12, "expYear": 2028 } }
```

---

## 16. Admin

> Pages: `admin/dashboard.html`, `admin/creators.html`, `admin/bundles.html`, `admin/safety.html`  
> All routes require `role: "admin"`.

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET    | `/admin/stats` | Platform overview: MRR, signups, report volume | ✓ Admin |
| GET    | `/admin/creators/applications` | Queue of pending creator applications | ✓ Admin |
| PUT    | `/admin/creators/applications/:appId/approve` | Approve a creator application | ✓ Admin |
| PUT    | `/admin/creators/applications/:appId/reject` | Reject a creator application | ✓ Admin |
| GET    | `/admin/reports` | Safety queue: flagged content/comments/profiles | ✓ Admin |
| PUT    | `/admin/reports/:reportId/resolve` | Resolve a report (action + note) | ✓ Admin |
| PUT    | `/admin/users/:userId/ban` | Ban a user platform-wide | ✓ Admin |
| PUT    | `/admin/users/:userId/warn` | Send an official warning | ✓ Admin |
| PUT    | `/admin/content/:contentId/takedown` | Remove content from the platform | ✓ Admin |
| GET    | `/admin/bundles` | List all platform bundles | ✓ Admin |
| POST   | `/admin/bundles` | Create a new bundle | ✓ Admin |
| PUT    | `/admin/bundles/:bundleId` | Edit a bundle | ✓ Admin |
| DELETE | `/admin/bundles/:bundleId` | Delete a bundle | ✓ Admin |

### Request / Response Details

**`GET /admin/stats`**
```json
// Response 200
{
  "success": true,
  "data": {
    "totalMRR": 842000,
    "mrrChange": 12.5,
    "newSignups24h": 1245,
    "signupChange": 4.2,
    "openReports": 42,
    "reportChange": -2
  }
}
```

**`GET /admin/reports`**  
Query params: `?status=open|resolved&type=comment|video|profile&page=1`
```json
// Response 200
{
  "success": true,
  "data": [
    {
      "_id", "risk": "high" | "medium" | "low",
      "type": "comment" | "video" | "profile",
      "reason": "Hate Speech",
      "contentPreview": "You are completely...",
      "reportedBy": "userId",
      "createdAt": "10 mins ago",
      "status": "open"
    }
  ]
}
```

**`PUT /admin/reports/:reportId/resolve`**
```json
// Body
{ "action": "ban" | "takedown" | "warn" | "ignore", "note": "Optional mod note" }
```

---

## 17. MongoDB Models Summary

```
User
  _id, fullName, email, passwordHash, role (viewer|creator|admin),
  avatarUrl, bio, username, isEmailVerified, createdAt

Station  (1-to-1 with creator User)
  _id, ownerId→User, name, bio, category, avatarUrl, bannerUrl,
  tags[], streamKey, subscriberCount, isLive, membershipsActive, createdAt

Video
  _id, stationId→Station, title, description, videoUrl, thumbnailUrl,
  visibility (public|members_only|private|unlisted), duration,
  views, likeCount, commentCount, status (processing|published|draft),
  publishedAt, createdAt

LiveStream
  _id, stationId→Station, title, scheduledAt, startedAt, endedAt,
  type (live|subscriber_chat), viewerCount, chatEnabled, status

Tier
  _id, stationId→Station, name, price, description, perks[],
  subscriberCount, isActive

Subscription
  _id, userId→User, stationId→Station, tierId→Tier | bundleId→Bundle,
  status (active|canceled|past_due), nextBillingDate, canceledAt

Bundle
  _id, name, description, price, stationIds[]→Station,
  isFeatured, subscriberCount, createdBy→User (admin)

Post  (community)
  _id, stationId→Station, authorId→User, title, body, imageUrl,
  likeCount, commentCount, createdAt

Comment
  _id, authorId→User, parentId→Post|Video|Comment,
  parentType (post|video|comment), text, likeCount,
  status (approved|held|flagged), createdAt

Perk  (digital asset)
  _id, stationId→Station, title, description, assetUrl,
  assetType (zip|audio|theme|other), requiredTierId→Tier

Report  (admin safety)
  _id, reportedBy→User, targetId (User|Video|Comment),
  targetType, reason, contentPreview, risk (high|medium|low),
  status (open|resolved), resolvedBy→User, action, createdAt

Transaction  (billing)
  _id, userId→User, subscriptionId→Subscription,
  description, amount, status (paid|failed|refunded),
  stripePaymentIntentId, invoiceUrl, createdAt

Payout  (creator earnings)
  _id, stationId→Station, transactionId, amount,
  method, status (paid|processing|failed), paidAt

Notification
  _id, userId→User, type, message, link, read, createdAt
```
