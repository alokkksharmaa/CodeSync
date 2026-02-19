# CodeSync Deployment Guide

This guide covers deploying CodeSync with separate frontend and backend hosting.

## Architecture

- **Frontend**: Static React app (GitHub Pages)
- **Backend**: Node.js + Socket.IO server (Render/Railway/Heroku)

## Prerequisites

- GitHub account
- Backend hosting account (Render recommended - free tier available)
- Git installed locally

---

## Part 1: Deploy Backend (Render)

### Step 1: Prepare Backend

1. Create `.env` file in `backend/` folder:
```bash
PORT=3000
FRONTEND_URL=https://yourusername.github.io
```

2. Update `FRONTEND_URL` after you know your GitHub Pages URL

### Step 2: Deploy to Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `codesync-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. Add Environment Variables:
   - `PORT`: `3000`
   - `FRONTEND_URL`: `https://yourusername.github.io/CodeSync`

6. Click "Create Web Service"

7. Wait for deployment (5-10 minutes)

8. Copy your backend URL (e.g., `https://codesync-backend.onrender.com`)

### Step 3: Update Backend CORS

After getting your GitHub Pages URL, update the environment variable:
- Go to Render dashboard → Your service → Environment
- Update `FRONTEND_URL` to your actual GitHub Pages URL
- Save changes (service will redeploy)

---

## Part 2: Deploy Frontend (GitHub Pages)

### Step 1: Update Frontend Environment

1. Edit `frontend/.env.production`:
```bash
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

Replace with your actual Render backend URL from Part 1.

### Step 2: Build Frontend

```bash
cd frontend
npm install
npm run build
```

This creates optimized files in `frontend/dist/`

### Step 3: Copy Build to Root

```bash
# From project root
cp -r frontend/dist/* .
```

Or on Windows PowerShell:
```powershell
Copy-Item -Path frontend/dist/* -Destination . -Recurse -Force
```

### Step 4: Commit and Push

```bash
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### Step 5: Enable GitHub Pages

1. Go to your GitHub repository
2. Click "Settings" → "Pages"
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click "Save"
5. Wait 2-3 minutes for deployment

Your site will be live at: `https://yourusername.github.io/CodeSync`

---

## Part 3: Update Backend CORS (Final Step)

Now that you have your GitHub Pages URL:

1. Go to Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Update `FRONTEND_URL` to: `https://yourusername.github.io`
5. Save (service will auto-redeploy)

---

## Testing Deployment

1. Open your GitHub Pages URL
2. Open browser console (F12)
3. Check for "Connecting to backend: https://..." message
4. Enter a room ID and join
5. Open the same URL in another browser/tab
6. Join the same room
7. Test real-time editing and cursor presence

---

## Troubleshooting

### Frontend can't connect to backend

**Check:**
- Backend is running (visit backend URL `/health` endpoint)
- `VITE_BACKEND_URL` in `.env.production` is correct
- Rebuild frontend after changing env variables

### CORS errors

**Check:**
- `FRONTEND_URL` in backend matches your GitHub Pages URL exactly
- No trailing slashes in URLs
- Backend redeployed after changing env variables

### Socket.IO connection fails

**Check:**
- Backend supports WebSocket connections
- No firewall blocking WebSocket
- Check browser console for error messages

### Changes not appearing

**Frontend:**
```bash
cd frontend
npm run build
cp -r dist/* ..
git add .
git commit -m "Update"
git push
```

**Backend:**
- Push changes to GitHub
- Render auto-deploys from GitHub

---

## Alternative Backend Hosting

### Railway.app

1. Sign up at [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub repo"
3. Select repository
4. Add environment variables
5. Deploy

### Heroku

1. Install Heroku CLI
2. Login: `heroku login`
3. Create app: `heroku create codesync-backend`
4. Set buildpack: `heroku buildpacks:set heroku/nodejs`
5. Deploy: `git subtree push --prefix backend heroku main`

---

## Environment Variables Summary

### Backend (.env)
```
PORT=3000
FRONTEND_URL=https://yourusername.github.io
```

### Frontend (.env.production)
```
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```

---

## Updating After Deployment

### Update Frontend
```bash
cd frontend
# Make changes
npm run build
cp -r dist/* ..
git add .
git commit -m "Update frontend"
git push
```

### Update Backend
```bash
# Make changes in backend/
git add .
git commit -m "Update backend"
git push
# Render auto-deploys
```

---

## Cost

- **GitHub Pages**: Free
- **Render Free Tier**: Free (spins down after 15 min inactivity)
- **Railway Free Tier**: $5 credit/month
- **Heroku**: No free tier (starts at $5/month)

**Recommendation**: Use Render free tier for testing, upgrade if needed.
