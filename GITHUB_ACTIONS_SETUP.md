# GitHub Actions Automated Deployment

This guide explains how to set up automated deployment using GitHub Actions.

## What It Does

Every time you push to `main` branch:
1. GitHub Actions automatically builds your frontend
2. Deploys to GitHub Pages
3. No manual build/copy steps needed!

## Setup Instructions

### Step 1: Add Backend URL Secret

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add:
   - Name: `VITE_BACKEND_URL`
   - Value: `https://your-backend-url.onrender.com`
5. Click **Add secret**

### Step 2: Enable GitHub Pages

1. Go to **Settings** → **Pages**
2. Under **Source**, select:
   - Source: **GitHub Actions**
3. Save

### Step 3: Push to Trigger Deployment

```bash
git add .
git commit -m "Enable automated deployment"
git push origin main
```

### Step 4: Monitor Deployment

1. Go to **Actions** tab in your repository
2. Watch the deployment workflow run
3. Once complete (green checkmark), your site is live!

## How to Update

Just push changes to main:

```bash
# Make changes to frontend code
git add .
git commit -m "Update feature"
git push origin main
```

GitHub Actions will automatically:
- Build the frontend
- Deploy to GitHub Pages

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow**
4. Select branch and run

## Troubleshooting

### Build fails

**Check:**
- `VITE_BACKEND_URL` secret is set correctly
- No syntax errors in code
- Dependencies are correct in `package.json`

### Deployment succeeds but site doesn't work

**Check:**
- Backend URL in secret is correct
- Backend is running and accessible
- CORS configured correctly on backend

### View build logs

1. Go to **Actions** tab
2. Click on the failed workflow run
3. Click on the job to see detailed logs

## Benefits

✅ No manual build steps
✅ Consistent deployments
✅ Automatic on every push
✅ Easy rollback (revert commit)
✅ Build logs for debugging

## Disable Automated Deployment

If you want to deploy manually:

1. Delete `.github/workflows/deploy.yml`
2. Follow manual deployment steps in `DEPLOYMENT.md`
