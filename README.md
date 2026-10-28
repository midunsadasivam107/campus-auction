# 🎓 Campus Auction

A student-only auction marketplace where graduating students sell used items — bicycles, calculators, textbooks, electronics, and other college essentials — to junior students through real-time, competitive auctions.

## ✨ Features

- **Student Authentication** — Secure registration, login, and profile management
- **Auction Listings** — Create listings with photos, categories, starting prices, and closing times
- **Real-Time Bidding** — Live bid updates via Socket.IO with countdown timers
- **Anti-Snipe Protection** — Bids in the last 30 seconds extend the auction by 60 seconds
- **Automatic Bidding** — Set a maximum bid and let the system bid for you
- **Auction Lifecycle** — Auto-close, seller approval, campus handover confirmation
- **Search & Filters** — Full-text search, category filters, price range, and sorting
- **Q&A** — Ask sellers questions before bidding
- **AI Assistant** — Natural language search and bidding assistance
- **Notifications** — In-app and browser notifications for auction events

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Real-Time | Socket.IO |
| Auth | JWT (httpOnly cookies) |
| Images | Cloudinary |
| AI | Google Gemini API |
| Testing | Vitest + Supertest |

## 📁 Project Structure

```
campus-auction/
├── client/          # React frontend (Vite)
├── server/          # Express backend
├── docs/            # Documentation
├── .env.example     # Environment variable template
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account
- (Optional) Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/<your-username>/campus-auction.git
   cd campus-auction
   ```

2. **Set up the server**
   ```bash
   cd server
   npm install
   cp ../.env.example .env
   # Edit .env with your MongoDB URI, JWT secret, Cloudinary keys
   ```

3. **Set up the client**
   ```bash
   cd ../client
   npm install
   ```

4. **Run in development**
   ```bash
   # Terminal 1 — Server
   cd server
   npm run dev

   # Terminal 2 — Client
   cd client
   npm run dev
   ```

5. **Open** `http://localhost:5173`

## 📚 Documentation

- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🏗 Architecture

```
React SPA  ──HTTP/WS──▶  Express API  ──▶  MongoDB Atlas
                          + Socket.IO       + Cloudinary
                          + Cron Jobs       + Gemini API
```

## 📝 License

MIT
