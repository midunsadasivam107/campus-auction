# 🚀 Campus Auction Deployment Guide

This document outlines deployment on free-tier platforms: **Vercel** (frontend), **Render** (backend), and **MongoDB Atlas** (database).

---

## 1. MongoDB Atlas Setup

1. Create a free **M0 Sandbox** cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Under **Database Access**, create a user with read and write privileges (e.g., `campus_admin`).
3. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere) so Render can connect.
4. Copy your connection string:
   ```
   mongodb+srv://campus_admin:<password>@cluster0.mongodb.net/campus-auction?retryWrites=true&w=majority
   ```

---

## 2. Cloudinary Setup (Image Uploads)

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. From the Dashboard, copy:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. *(Optional)* If Cloudinary credentials are omitted in development, Campus Auction automatically falls back to in-memory Base64 data URIs.

---

## 3. Backend Deployment (Render)

1. Create a **New Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Set Environment Variables in Render Dashboard:
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://campus_admin:<password>@cluster0.mongodb.net/campus-auction
   JWT_SECRET=generate-a-secure-random-64-character-string
   JWT_EXPIRES_IN=7d
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   GEMINI_API_KEY=your_gemini_api_key
   CLIENT_URL=https://your-frontend-app.vercel.app
   ```
5. Deploy. Verify health check: `https://your-backend.onrender.com/api/health` returns `status: ok`.

---

## 4. Frontend Deployment (Vercel)

1. Import your GitHub repository into [Vercel](https://vercel.com/).
2. Configure project:
   - **Root Directory**: `client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   ```env
   VITE_API_URL=https://your-backend.onrender.com
   ```
4. Deploy. The `vercel.json` file automatically handles single-page application client routing.

---

## 5. Post-Deployment Verification

1. Register two student accounts.
2. Create an auction listing with photos.
3. Place bids from both accounts in different browser windows and observe instant real-time synchronization.
4. Place a bid within 30 seconds of closing to observe the anti-snipe 60-second extension.
5. Let the auction close and verify seller approval.
