# 🚀 CodeSync Deployment Checklist

Use this checklist to ensure successful deployment.

## ✅ Pre-Deployment

- [ ] All code committed and pushed to GitHub
- [ ] `frontend/.env.production` exists
- [ ] `backend/.env.example` exists
- [ ] `.gitignore` excludes `.env` files
- [ ] No hardcoded URLs in code
- [ ] Backend uses `process.env.FRONTEND_URL` for CORS
- [ ] Frontend uses `import.meta.env.VITE_BACKEND_URL`

## 🔧 Backend Deployment (Render)

- [ ] Created Render account
- [ ] Connected GitHub repository
- [ ] Created new Web Service
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Added environment variable: `PORT=3000`
- [ ] Added environment variable: `FRONTEND_URL=https://yourusername.github.io/CodeSync`
- [ ] Deployment successful (green status)
- [ ] Copied backend URL (e.g., `https://codesync-backend-xyz.onrender.com`)
- [ ] Tested `/health` endpoint returns `{"status":"ok"}`

## 🎨 Frontend Configuration

- [ ] Updated `frontend/.env.production` with backend URL
- [ ] Verified `vite.config.js` has `base: '/CodeSync/'`
- [ ] Ran `npm install` in frontend folder
- [ ] Ran `npm run build` successfully
- [ ] `frontend/dist/` folder created with files

## 📦 GitHub Pages Deployment

### Option A: Manual Deployment

- [ ] Copied `frontend/dist/*` to project root
- [ ] Committed all files including `index.html` and `assets/`
- [ ] Pushed to GitHub main branch
- [ ] Enabled GitHub Pages (Settings → Pages)
- [ ] Selected Source: Branch `main`, Folder `/ (root)`
- [ ] Waited 2-3 minutes for deployment
- [ ] Visited GitHub Pages URL

### Option B: Automated Deployment (GitHub Actions)

- [ ] Added `VITE_BACKEND_URL` secret in GitHub repo settings
- [ ] Changed Pages source to "GitHub Actions"
- [ ] Pushed `.github/workflows/deploy.yml` to main
- [ ] Workflow ran successfully
- [ ] Visited GitHub Pages URL

## 🔄 Post-Deployment

- [ ] Frontend loads without errors
- [ ] Browser console shows "Connecting to backend: https://..."
- [ ] No CORS errors in console
- [ ] Can enter room ID and join
- [ ] Opened in 2 browser tabs
- [ ] Joined same room in both tabs
- [ ] Typing in one tab appears in other tab
- [ ] Cursor presence visible in both tabs
- [ ] User count updates correctly
- [ ] Can leave room successfully

## 🐛 Troubleshooting

### Frontend Issues

**Blank page:**
- [ ] Check browser console for errors
- [ ] Verify `index.html` exists in root
- [ ] Check `assets/` folder exists with JS/CSS files

**404 errors:**
- [ ] Verify `base: '/CodeSync/'` in `vite.config.js`
- [ ] Check GitHub Pages is enabled
- [ ] Wait 2-3 minutes after enabling

**Can't connect to backend:**
- [ ] Check `VITE_BACKEND_URL` in `.env.production`
- [ ] Rebuild frontend after changing env
- [ ] Verify backend is running (visit `/health`)

### Backend Issues

**CORS errors:**
- [ ] Check `FRONTEND_URL` matches GitHub Pages URL exactly
- [ ] No trailing slashes in URLs
- [ ] Redeploy backend after changing env

**Backend not responding:**
- [ ] Check Render dashboard for errors
- [ ] View logs in Render
- [ ] Verify environment variables are set
- [ ] Check if service is sleeping (free tier)

**Socket.IO connection fails:**
- [ ] Check backend logs for connection attempts
- [ ] Verify WebSocket support enabled
- [ ] Check firewall/network settings

## 📊 Success Metrics

- [ ] Backend uptime > 99%
- [ ] Frontend loads in < 3 seconds
- [ ] Real-time sync latency < 500ms
- [ ] No console errors
- [ ] Works in Chrome, Firefox, Safari
- [ ] Works on mobile devices

## 🔐 Security Checklist

- [ ] No API keys in frontend code
- [ ] `.env` files in `.gitignore`
- [ ] CORS properly configured
- [ ] No sensitive data in room state
- [ ] Backend validates all inputs

## 📝 Documentation

- [ ] Updated README with deployment URLs
- [ ] Documented environment variables
- [ ] Added troubleshooting guide
- [ ] Created user guide (optional)

## 🎯 Final Verification

Test the complete flow:

1. [ ] Open GitHub Pages URL
2. [ ] Enter room ID: `test-room-123`
3. [ ] Click "Join Room"
4. [ ] See editor with welcome message
5. [ ] Open same URL in incognito/another browser
6. [ ] Join same room: `test-room-123`
7. [ ] Type in first window
8. [ ] See text appear in second window
9. [ ] See colored cursor in second window
10. [ ] Type in second window
11. [ ] See text and cursor in first window
12. [ ] Close one window
13. [ ] User count decreases in other window

## ✨ Deployment Complete!

If all checkboxes are checked, your CodeSync app is successfully deployed!

**Your URLs:**
- Frontend: `https://yourusername.github.io/CodeSync`
- Backend: `https://your-backend.onrender.com`

Share with friends and start collaborating! 🎉

---

## 📞 Need Help?

- Check `DEPLOYMENT.md` for detailed guide
- Check `QUICK_DEPLOY.md` for quick reference
- Check `GITHUB_ACTIONS_SETUP.md` for automated deployment
- Review backend logs in Render dashboard
- Check browser console for frontend errors
