# Troubleshooting Guide

## Common Issues and Solutions

### 1. Judge0 API Key Errors

**Error Message:**
```
Code execution error: AxiosError: Request failed with status code 401
Invalid API key. Go to https://docs.rapidapi.com/docs/keys for more info.
```

**Cause:** 
- No RAPIDAPI_KEY set in `.env`
- Invalid or expired API key
- API key not properly configured

**Solution:**

#### Option A: Use Mock Execution (Development)
The app now automatically falls back to mock execution when no API key is configured. This is perfect for development and testing the UI.

**What you'll see:**
- Code validation message
- Instructions to set up real execution
- Preview of your code

**No action needed** - just continue developing!

#### Option B: Set Up Real Code Execution (Production)

1. **Get API Key:**
   - Go to [RapidAPI Judge0](https://rapidapi.com/judge0-official/api/judge0-ce)
   - Sign up for free account
   - Subscribe to Judge0 CE (free tier available)
   - Copy your API key

2. **Configure Backend:**
   ```bash
   cd backend
   # Create or edit .env file
   echo "RAPIDAPI_KEY=your-actual-api-key-here" >> .env
   ```

3. **Restart Backend:**
   ```bash
   npm run dev
   ```

4. **Verify:**
   - Run code in the editor
   - Should see real execution results
   - Check backend logs for "Execution completed"

---

### 2. User Disconnect Errors

**Error Message:**
```
Client disconnected: fdVynGcRe855cOXJAAAH
[Multiple disconnect messages]
```

**Cause:**
- Users closing browser/tab
- Network interruptions
- Socket connection timeouts

**Solution:**
✅ **Already Fixed!** The disconnect handler now properly:
- Cleans up room state
- Notifies other users
- Removes user from all rooms
- Logs meaningful disconnect messages

**What happens now:**
1. User disconnects (closes tab, network issue, etc.)
2. Server detects disconnect
3. User removed from all rooms they were in
4. Other users in those rooms get notified
5. Room deleted if empty
6. Clean logs: `User left room 1234 on disconnect`

---

### 3. Cannot Type in Editor

**Symptoms:**
- Editor appears but typing doesn't work
- Characters don't appear
- Cursor doesn't move

**Causes & Solutions:**

#### A. Editor Not Focused
**Solution:** Click inside the editor area

#### B. Browser Console Errors
**Solution:** 
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Look for Monaco Editor errors
4. Refresh page

#### C. Socket Not Connected
**Solution:**
1. Check connection status (top right)
2. Should show "● Connected" in green
3. If disconnected, check backend is running
4. Verify CORS settings

---

### 4. Output Panel Not Showing

**Symptoms:**
- Click "Run Code" but no output appears
- Output panel doesn't open

**Solutions:**

1. **Check Output Toggle:**
   - Click "📋 Show Output" button
   - Panel should appear

2. **Check Execution Status:**
   - Look for "⏳ Running..." on Run button
   - Wait for execution to complete

3. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for execution errors
   - Check network tab for failed requests

4. **Verify Backend:**
   ```bash
   # Check backend is running
   curl http://localhost:3000/health
   ```

---

### 5. Authentication Errors

**Error Message:**
```
Authentication required
Invalid token
User not found
```

**Solutions:**

#### A. No Token / Expired Token
1. Logout and login again
2. Clear browser localStorage:
   ```javascript
   // In browser console
   localStorage.clear()
   ```
3. Refresh page and login

#### B. Backend Not Running
1. Start backend server:
   ```bash
   cd backend
   npm run dev
   ```

#### C. JWT Secret Mismatch
1. Check `.env` has JWT_SECRET
2. Restart backend after changing .env
3. All users need to login again

---

### 6. Room State Issues

**Symptoms:**
- Code not syncing between users
- Cursor positions wrong
- Language changes not syncing

**Solutions:**

1. **Refresh All Clients:**
   - Have all users refresh their browsers
   - Rejoin the room

2. **Check Backend Logs:**
   ```bash
   # Look for these messages
   User joined room: 1234
   Code change in room: 1234
   Language changed to python in room: 1234
   ```

3. **Verify Socket Connection:**
   - Check "Connected" status in UI
   - Look for socket errors in browser console

4. **Restart Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   Note: This clears all room state (in-memory storage)

---

### 7. CORS Errors

**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**

1. **Check Backend CORS Config:**
   ```javascript
   // backend/server.js
   const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
   ```

2. **Update .env:**
   ```bash
   FRONTEND_URL=http://localhost:5173
   ```

3. **For Production:**
   ```bash
   FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Restart Backend**

---

### 8. Monaco Editor Not Loading

**Symptoms:**
- Blank editor area
- Loading spinner forever
- Console errors about Monaco

**Solutions:**

1. **Check Internet Connection:**
   - Monaco loads from CDN
   - Requires internet access

2. **Clear Browser Cache:**
   - Hard refresh: Ctrl+Shift+R (Windows) / Cmd+Shift+R (Mac)

3. **Check Console Errors:**
   - Look for 404 errors
   - Check for CSP violations

4. **Reinstall Dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   ```

---

### 9. Resizable Panel Issues

**Symptoms:**
- Can't resize output panel
- Resize handle not working
- Panel stuck at one size

**Solutions:**

1. **Check Mouse Events:**
   - Try clicking and dragging slowly
   - Ensure mouse is over the divider

2. **Browser Compatibility:**
   - Use modern browser (Chrome, Firefox, Safari, Edge)
   - Update browser to latest version

3. **Check Console:**
   - Look for JavaScript errors
   - Verify ResizablePanel component loaded

---

## Debug Mode

### Enable Verbose Logging

**Backend:**
```javascript
// backend/server.js
// Add at top
process.env.DEBUG = 'socket.io:*';
```

**Frontend:**
```javascript
// frontend/src/services/socket.js
// Add after import
localStorage.debug = 'socket.io-client:*';
```

### Check Health Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "rooms": 0,
  "timestamp": "2026-02-20T..."
}
```

### Test Authentication

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","username":"tester"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

---

## Performance Issues

### Slow Typing

**Causes:**
- Too many remote cursors
- Large code files
- Slow network

**Solutions:**
1. Reduce debounce time in MonacoEditor.jsx (currently 300ms)
2. Limit room size to 5-10 users
3. Use faster network connection

### High Memory Usage

**Causes:**
- Many rooms in memory
- Large code files
- Memory leaks

**Solutions:**
1. Restart backend periodically
2. Implement room cleanup (auto-delete after 24h)
3. Add database persistence
4. Limit code file size

---

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Check browser console for errors
3. ✅ Check backend logs
4. ✅ Try restarting backend and frontend
5. ✅ Try in incognito/private mode
6. ✅ Try different browser

### Information to Provide

When reporting issues, include:
- Error messages (full text)
- Browser and version
- Operating system
- Steps to reproduce
- Backend logs
- Browser console logs
- Screenshots if applicable

### Useful Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Check backend dependencies
cd backend && npm list

# Check frontend dependencies
cd frontend && npm list

# View backend logs
cd backend && npm run dev 2>&1 | tee backend.log

# Check port usage
# Windows
netstat -ano | findstr :3000
# Mac/Linux
lsof -i :3000
```

---

## Quick Fixes Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] .env file configured
- [ ] Dependencies installed (npm install)
- [ ] Browser cache cleared
- [ ] Logged in with valid account
- [ ] Socket connected (green status)
- [ ] No console errors
- [ ] CORS configured correctly
- [ ] Firewall not blocking ports

---

**Still having issues?** Check the main README.md or create an issue with detailed information.
