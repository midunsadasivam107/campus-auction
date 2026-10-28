# 🎓 Campus Auction

> A real-time student marketplace where graduating students auction used items (bicycles, calculators, textbooks, electronics) to junior students.

---

## ⚡ Features

- **Student Auth**: Secure registration & login with password hashing and JWT sessions.
- **Auction Listings**: Post items with multiple photos, categories, conditions, and starting prices.
- **Live Bidding**: Sub-second bid updates via Socket.IO with countdown timers.
- **Anti-Sniping**: Bids placed with $\le$ 30 seconds remaining automatically extend the deadline by 60 seconds.
- **Proxy Auto-Bidding**: Set a confidential maximum and let the system automatically counter competing bids.
- **Campus Handover**: Auto-closing auctions, seller price approval, and confirmed in-person campus handover.
- **Q&A Thread**: Item-specific questions and answers before bidding with rate limiting.
- **AI Assistant**: Natural language search ("Find a bicycle under ₹2,000") with personal budget guardrails.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.IO
- **Database**: MongoDB with Mongoose
- **Image Hosting**: Cloudinary (with local fallback)
- **AI**: Google Gemini API (with local rule-based fallback)
- **Testing**: Vitest (41 passing tests)

---

## 🚀 Quick Start

### 1. Setup Environment
Copy `.env.example` to `.env` in the root and in `server/`:
```bash
cp .env.example .env
```
Ensure your MongoDB is running locally (`mongodb://127.0.0.1:27017/campus-auction`) or paste your MongoDB Atlas URI.

### 2. Start Backend
```bash
cd server
npm install
npm run dev
```
Backend runs on **http://localhost:5000**.

### 3. Start Frontend
In a second terminal:
```bash
cd client
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## 🧪 Testing

Run the full backend test suite:
```bash
cd server
npm test
```
All 41 tests cover bidding concurrency, anti-snipe logic, proxy bidding, and state transitions.

---

## 📁 Project Structure

```text
campus-auction/
├── client/              # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/  # AuctionCard, BidForm, CountdownTimer, etc.
│   │   ├── pages/       # Home, Search, AuctionDetail, Dashboards, AI
│   │   └── services/    # API and Socket.IO client
├── server/              # Express backend
│   ├── controllers/     # Auth, Listings, Bids, Q&A, AI
│   ├── models/          # User, Listing, Bid, AutoBid, Question, Notification
│   ├── services/        # Atomic bidding, anti-snipe, auto-bid engine
│   ├── jobs/            # 10s recurring auction closer cron
│   └── tests/           # 41 unit & concurrency tests
└── docs/                # API, Architecture, and Deployment guides
```
