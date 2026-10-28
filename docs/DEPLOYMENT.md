# Deployment Guide

## Services

| Service | Platform | Tier |
|---------|---------|------|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| Database | MongoDB Atlas | M0 Free |
| Images | Cloudinary | Free (25 credits/mo) |

## Steps

1. **MongoDB Atlas** — Create M0 cluster, whitelist `0.0.0.0/0`, create DB user
2. **Cloudinary** — Sign up, note cloud name + API key + secret
3. **Render** — Deploy `server/` as Web Service, set env vars
4. **Vercel** — Deploy `client/`, set `VITE_API_URL` to Render URL

## Environment Variables

See `.env.example` for the full list.
