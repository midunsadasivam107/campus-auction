# 🎓 Campus Auction — REST API Reference

All requests and responses use JSON. Authenticated endpoints use JWT stored in httpOnly cookies, with optional fallback to `Authorization: Bearer <token>`.

Base URL in development: `http://localhost:5000/api`

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Register a new student account.
- **Access**: Public (Rate limited: 20 req/15min)
- **Body**:
  ```json
  {
    "name": "Rahul Kumar",
    "email": "rahul@campus.edu",
    "password": "Password123!",
    "studentId": "2023CSB101",
    "graduationYear": 2026
  }
  ```
- **Response `201`**:
  ```json
  {
    "status": "success",
    "token": "eyJhbGciOi...",
    "user": {
      "_id": "671e...",
      "name": "Rahul Kumar",
      "email": "rahul@campus.edu",
      "studentId": "2023CSB101",
      "graduationYear": 2026
    }
  }
  ```

### `POST /api/auth/login`
Authenticate an existing student.
- **Access**: Public
- **Body**: `{ "email": "rahul@campus.edu", "password": "Password123!" }`
- **Response `200`**: User object + httpOnly JWT cookie.

### `POST /api/auth/logout`
Clears the JWT authentication cookie.
- **Access**: Public / Authenticated

### `GET /api/auth/me`
Fetch current logged in student profile.
- **Access**: Private

### `PUT /api/auth/profile`
Update student profile and safety guardrails.
- **Access**: Private
- **Body**:
  ```json
  {
    "bio": "Final year CSE student",
    "spendingLimit": 5000,
    "studentId": "2023CSB101"
  }
  ```

---

## 2. Listings (`/api/listings`)

### `GET /api/listings`
Browse, search, filter, and sort active auctions.
- **Access**: Public
- **Query Parameters**:
  - `q`: Text search across title and description
  - `category`: `textbooks` | `electronics` | `bicycles` | `calculators` | `furniture` | `clothing` | `sports` | `stationery` | `other`
  - `condition`: `like_new` | `good` | `fair` | `worn`
  - `minPrice`: Minimum current price (₹)
  - `maxPrice`: Maximum current price (₹)
  - `closingSoon`: `true` (filters to closing in 24 hours)
  - `sort`: `closing_soon` | `latest` | `price_asc` | `price_desc`
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)

### `POST /api/listings`
Create a new auction listing.
- **Access**: Private
- **Body**:
  ```json
  {
    "title": "Hero Sprint Bicycle 21-Speed",
    "description": "Used for two semesters on campus. Includes lock and bell.",
    "category": "bicycles",
    "condition": "good",
    "startingPrice": 1500,
    "minBidIncrement": 50,
    "closingTime": "2026-10-30T18:00:00.000Z",
    "images": [{ "url": "https://..." }]
  }
  ```

### `POST /api/listings/upload`
Upload listing photos (up to 5 images, max 5MB each).
- **Access**: Private
- **Body**: Multipart form data with `images` field.

### `GET /api/listings/:id`
Get detailed information for a single auction.
- **Access**: Public

### `PUT /api/listings/:id`
Edit an auction listing. Only allowed for seller if `bidCount === 0`.
- **Access**: Private (Seller only)

### `DELETE /api/listings/:id`
Cancel an auction listing. Only allowed for seller if `bidCount === 0`.
- **Access**: Private (Seller only)

### `POST /api/listings/:id/approve`
Seller approves the winning price of a closed auction. Transitions status to `sold` and reserves item for winner.
- **Access**: Private (Seller only)

### `POST /api/listings/:id/reject`
Seller rejects the winning price.
- **Access**: Private (Seller only)

### `POST /api/listings/:id/confirm-pickup`
Seller or winning buyer confirms campus handover. Transitions to `completed`.
- **Access**: Private (Seller or Winner)

### `GET /api/listings/my/selling`
Get listings created by the current student.
- **Access**: Private

---

## 3. Bidding (`/api/listings/:id/bids` & `/api/bids`)

### `POST /api/listings/:id/bids`
Place an atomic bid on an auction.
- **Access**: Private (Rate limited: 30 bids/min)
- **Body**: `{ "amount": 1600 }`
- **Rules**:
  - First bid must be >= `startingPrice`
  - Subsequent bids must be >= `currentPrice + minBidIncrement`
  - Cannot bid on own listing
  - Concurrency protected via MongoDB atomic `findOneAndUpdate`
  - If placed with <= 30s remaining, deadline automatically extended to +60s
  - Broadcasts `new-bid` to Socket.IO `auction:${id}` room
- **Response `201`**:
  ```json
  {
    "status": "success",
    "message": "Bid placed successfully!",
    "bid": {
      "_id": "671f...",
      "amount": 1600,
      "createdAt": "2026-10-28T10:00:00.000Z",
      "bidder": { "name": "Rahul K." }
    },
    "listing": {
      "currentPrice": 1600,
      "bidCount": 5
    },
    "wasExtended": false
  }
  ```

### `GET /api/listings/:id/bids`
Public bid history for an auction with anonymized student names.
- **Access**: Public

### `GET /api/bids/my`
List of all bids placed by the authenticated student.
- **Access**: Private

---

## 4. Automatic Proxy Bidding (`/api/listings/:id/auto-bid`)

### `POST /api/listings/:id/auto-bid`
Configure confidential maximum auto-bid for proxy bidding.
- **Access**: Private
- **Body**: `{ "maxAmount": 3000 }`
- **Rules**:
  - Maximum amount is strictly confidential and never returned publicly
  - Counters other bids deterministically by minimum increment (+₹10)
  - Prioritizes earlier auto-bids in ties

### `GET /api/listings/:id/auto-bid`
Retrieve authenticated student's own active auto-bid on this item.
- **Access**: Private

### `DELETE /api/listings/:id/auto-bid`
Cancel automatic bidding on this listing.
- **Access**: Private

---

## 5. Questions & Answers (`/api/listings/:id/questions` & `/api/questions`)

### `POST /api/listings/:id/questions`
Ask a question before bidding.
- **Access**: Private (Rate limit: max 5 questions per hour per student per auction)
- **Body**: `{ "question": "Does this bicycle have gear cables replaced recently?" }`

### `GET /api/listings/:id/questions`
Get all public Q&A for an auction.
- **Access**: Public

### `PUT /api/questions/:qid/answer`
Seller publishes a public answer to a student's question.
- **Access**: Private (Seller only)
- **Body**: `{ "answer": "Yes, serviced last month with new brake pads and cables." }`

---

## 6. Notifications (`/api/notifications`)

### `GET /api/notifications`
Fetch in-app notifications.
- **Access**: Private

### `GET /api/notifications/unread-count`
Get count of unread notifications for navbar bell badge.
- **Access**: Private

### `PUT /api/notifications/:id/read`
Mark single notification as read.
- **Access**: Private

### `PUT /api/notifications/read-all`
Mark all notifications as read.
- **Access**: Private

---

## 7. Saved Searches (`/api/saved-searches`)

### `POST /api/saved-searches`
Save search filters (e.g., "bicycles under ₹2,000") to receive alerts when items match.
- **Access**: Private
- **Body**:
  ```json
  {
    "label": "Bicycles under ₹2,000",
    "filters": {
      "category": "bicycles",
      "maxPrice": 2000
    }
  }
  ```

### `GET /api/saved-searches`
Get current student's active saved searches.
- **Access**: Private

### `DELETE /api/saved-searches/:id`
Delete a saved search.
- **Access**: Private

---

## 8. AI Assistant (`/api/ai`)

### `POST /api/ai/chat`
Conversational natural language search and auction assistant.
- **Access**: Public / Optional Auth (Rate limit: 10 req/min)
- **Body**: `{ "message": "Find me a calculator under ₹500" }`
- **Response `200`**:
  ```json
  {
    "status": "success",
    "reply": "I found 2 calculators matching your budget:",
    "listings": [ ... ]
  }
  ```
