# Testing Activity Feed

## Steps to Debug:

1. **Make sure backend server is running:**
   ```bash
   cd backend
   npm start
   ```

2. **Make sure frontend is running:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser console (F12) and check for:**
   - `[ActivityFeed] Loading activities for workspace: ...`
   - `[ActivityFeed] Received activities: ...`
   - Any error messages

4. **Check Network tab:**
   - Look for the request to `/api/workspaces/{id}/activity`
   - Check if it returns 200 OK
   - Check the response data

5. **Common Issues:**
   - Backend not running
   - Frontend not connected to backend
   - CORS issues
   - Authentication token missing
   - Wrong workspace ID

## Manual Test:

If you have a token, you can test the endpoint directly:

```bash
# Get your auth token from browser localStorage
# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/workspaces/699d2dec5279e7843c12ed79/activity
```

## What Should Happen:

When you open a workspace, you should see:
- Activities loading in the Activity panel
- Console logs showing the API call
- Activities displayed with icons and usernames
