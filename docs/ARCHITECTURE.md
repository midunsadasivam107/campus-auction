# Architecture

> See the implementation plan for the full architecture diagram and component interaction details.

## Overview

Campus Auction uses a classic three-tier architecture:

1. **Frontend** — React SPA served by Vite (dev) / Vercel (prod)
2. **Backend** — Node.js + Express REST API with Socket.IO for real-time
3. **Data** — MongoDB Atlas + Cloudinary CDN

## Key Design Decisions

- **JWT in httpOnly cookies** for stateless auth without XSS exposure
- **MongoDB atomic updates** for concurrent bid safety
- **Socket.IO rooms** for efficient per-auction event broadcasting
- **Cron-based auction closing** (10s interval) for simplicity over per-auction timers
