# Quick Deploy Checklist

Follow these steps in order for successful deployment.

## ✅ Pre-Deployment Checklist

- [ ] Node.js installed
- [ ] Git repository pushed to GitHub
- [ ] Render account created (or Railway/Heroku)

---

## 🚀 Deploy Backend First

### 1. Deploy to Render

```bash
# No local changes needed - deploy directly from GitHub
```

1. Go to [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Settings:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
4. Environment Variables:
   - `PORT` = `3000`
   - `FRONTEND_URL` = `https://yourusername.github.io/CodeSync`
5. Create Service
6. **Copy your backend URL** (e.g., `https://codesync-backend-xyz.onrender.com`)

---

## 🎨 Deploy Frontend Second

### 2. Update Frontend Config

Edit `frontend/.env.production`:
```bash
VITE_BACKEND_URL=https://your-backend-url.onrender.com
```
(Use the URL from step 1)

### 3. Build and Deploy

```bash
# Build frontend
cd frontend
npm install
npm run build

# Copy to root (from project root)
cd ..
cp -r frontend/dist/* .

# Commit and push
git add .
git commit -m "Deploy to GitHub Pages"
git push origin main
```

### 4. Enable GitHub Pages

1. GitHub repo → Settings → Pages
2. Source: Branch `main`, Folder `/ (root)`
3. Save
4. Wait 2-3 minutes

Your site: `https://yourusername.github.io/CodeSync`

---

## 🔄 Update Backend CORS (Important!)

After GitHub Pages is live:

1. Render dashboard → Your service → Environment
2. Confirm `FRONTEND_URL` = `https://yourusername.github.io/CodeSync`
3. Save (auto-redeploys)

---

## ✨ Test It

1. Open your GitHub Pages URL
2. Open in 2 browser tabs
3. Join same room in both
4. Type and see real-time sync + cursors!

---

## 🐛 Quick Fixes

**Can't connect to backend?**
```bash
# Rebuild frontend
cd frontend
npm run build
cp -r dist/* ..
git add . && git commit -m "Fix" && git push
```

**CORS error?**
- Check `FRONTEND_URL` in Render matches GitHub Pages URL exactly
- Redeploy backend

**Backend sleeping (Render free tier)?**
- First request takes 30-60 seconds to wake up
- Upgrade to paid tier for always-on

---

## 📝 Commands Reference

### Rebuild Frontend
```bash
cd frontend && npm run build && cd .. && cp -r frontend/dist/* .
```

### Deploy Frontend
```bash
git add . && git commit -m "Update" && git push
```

### Check Backend Health
```bash
curl https://your-backend-url.onrender.com/health
```

---

## 🎯 Success Criteria

- [ ] Backend `/health` endpoint returns `{"status":"ok"}`
- [ ] Frontend loads without errors
- [ ] Console shows "Connecting to backend: https://..."
- [ ] Can join rooms
- [ ] Real-time editing works
- [ ] Cursor presence visible

Done! 🎉
