# Troubleshooting Guide - Dual Mind Game Suite

## Common Issues & Solutions

---

## 1. Development & Setup Issues

### Issue: "Module not found" or import errors

**Symptoms**: Red squiggles in VS Code or errors in browser console about missing modules.

**Solutions**:

- Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Restart the dev server: `npm run dev`
- Check file paths are correct (case-sensitive on Unix/Linux)
- Verify all imports use `.js` extension: `import { X } from './file.js'`

---

### Issue: Vite compilation errors

**Symptoms**: Browser shows "Failed to parse source" or similar Vite plugin errors.

**Solutions**:

1. Check the browser console for the exact file and line number
2. Ensure the file has valid JavaScript syntax (matching braces, quotes, etc.)
3. Check that game class files export properly: `export class GameName { ... }`
4. Verify no trailing commas or syntax errors in JSON files
5. Run `npm run build` locally to catch errors early

---

### Issue: Python dependencies not installing

**Symptoms**: `ModuleNotFoundError` when running Python scripts, or missing imports in VS Code.

**Solutions**:

```bash
# Upgrade pip
python -m pip install --upgrade pip

# Install required packages
pip install numpy pandas scikit-learn xgboost flask flask-cors

# For development
pip install pylint

# Verify installation
pip list
```

---

### Issue: Flask API server won't start

**Symptoms**: Port already in use, or connection refused errors.

**Solutions**:

```bash
# Check if process is running on port 5000
netstat -an | grep 5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows

# Kill the process (if needed)
lsof -ti:5000 | xargs kill -9  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# Start with a different port
FLASK_ENV=development FLASK_APP=api_server.py python -m flask run --port 5001
```

---

## 2. Game Functionality Issues

### Issue: Game grid not displaying

**Symptoms**: Blank or grey area where game board should be.

**Solutions**:

1. Open browser DevTools (F12) and check Console for errors
2. Check that the game class exports correctly with `async init()` method
3. Verify `render()` and `getState()` methods exist in game class
4. Check HTML element IDs match what JavaScript expects
5. Verify CSS is loaded and display isn't set to `none`

---

### Issue: Turn not switching between players

**Symptoms**: One player can play multiple turns in a row.

**Solutions**:

- Check GameController's `switchPlayer()` is called after valid moves
- Verify `currentPlayer` state is being updated
- Check that game engine's `makeMove()` returns proper validation
- Look for logic errors in turn check (e.g., checking wrong condition)

---

### Issue: Game reset not working

**Symptoms**: Clicking "New Game" or "Reset" doesn't clear the board.

**Solutions**:

- Ensure `resetGame()` method clears all state variables
- Check that UI elements are properly cleared/re-rendered
- Verify event listeners aren't still firing old data
- Check for closure issues capturing old state

---

## 3. ML & Analytics Issues

### Issue: ML predictions not loading

**Symptoms**: Skill tier shows "Unknown" or performance index is 0.

**Solutions**:

1. Check that Flask server is running: `python api_server.py`
2. Verify Python dependencies are installed: `pip list`
3. Check CORS is enabled: `from flask_cors import CORS; CORS(app)`
4. Look at browser Console for network errors (check Network tab in DevTools)
5. Test API directly: `curl http://localhost:5000/api/health`

---

### Issue: Feature extraction not working

**Symptoms**: No performance metrics tracked, empty analytics dashboard.

**Solutions**:

- Check FeatureExtractor is initialized in main.js
- Verify move events are being captured by EventBus
- Check browser console for JavaScript errors
- Ensure StorageManager is initialized for data persistence

---

### Issue: Python ML model won't load

**Symptoms**: Flask 500 errors when calling prediction endpoints.

**Solutions**:

1. Check model file exists: `ls python/models/`
2. Verify model format (pickle `.pkl` files)
3. Check version compatibility of scikit-learn used for training vs inference
4. Look at server logs for full error traceback
5. Retrain the model: `python python/ml/train_models.py`

---

## 4. Browser & Display Issues

### Issue: Game not responsive on mobile

**Symptoms**: Layout breaks on small screens, buttons not clickable.

**Solutions**:

- Check viewport meta tag in HTML: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
- Test with DevTools mobile emulation (Ctrl+Shift+M)
- Ensure CSS uses relative units (%, rem, vw) not fixed pixels
- Check touch events are handled: `touchstart`, `touchend`, `touchmove`

---

### Issue: Dark mode not working

**Symptoms**: Theme toggle doesn't change colors.

**Solutions**:

- Check CSS variables are defined: `--color-bg`, `--color-text`, etc.
- Verify `data-theme="dark"` is applied to document root
- Check stylesheet loads after theme is set
- Clear browser cache as CSS might be cached

---

### Issue: Canvas rendering is blurry or slow

**Symptoms**: Game board appears pixelated or has low FPS.

**Solutions**:

1. Set canvas resolution to match display resolution (2x for retina):
   ```javascript
   canvas.width = canvas.clientWidth * window.devicePixelRatio;
   canvas.height = canvas.clientHeight * window.devicePixelRatio;
   ```
2. Use `requestAnimationFrame` for smooth animation
3. Check that expensive operations aren't in render loop
4. Profile with DevTools Performance tab to find bottlenecks

---

## 5. Data & Persistence Issues

### Issue: Game history not saving

**Symptoms**: Sessions disappear on page refresh.

**Solutions**:

- Check browser allows localStorage: test in DevTools Console `localStorage.setItem('test', '1')`
- Verify StorageManager is initialized before using
- Check browser's storage quota isn't exceeded
- Look for JSON serialization errors in browser console

---

### Issue: Settings not persisting

**Symptoms**: Need to reselect theme/accessibility options each time.

**Solutions**:

- Ensure settings are saved to localStorage: `await storageManager.set('settings', {...})`
- Check settings are loaded on app init: `await loadSettings()`
- Verify no errors in DevTools Console during save
- Clear localStorage if corrupted: `localStorage.clear()`

---

### Issue: IndexedDB not working

**Symptoms**: Analytics data not stored, performance metrics lost.

**Solutions**:

1. Check browser supports IndexedDB (all modern browsers do)
2. Open DevTools → Application → IndexedDB to inspect database
3. Check IndexedDB quota isn't exceeded
4. Verify database schema matches code expectations
5. Consider fallback to localStorage if IndexedDB unavailable

---

## 6. Performance Issues

### Issue: Application is slow or stuttering

**Symptoms**: Noticeable lag when clicking, animations not smooth.

**Solutions**:

1. Open DevTools Performance tab and record a session
2. Look for long tasks blocking the main thread
3. Check for memory leaks: take heap snapshots before/after sessions
4. Reduce animation complexity or duration
5. Optimize feature extraction (don't calculate unnecessary data)

---

### Issue: High CPU usage

**Symptoms**: Computer fan running loudly, battery drains quickly.

**Solutions**:

- Check for infinite loops in game logic
- Ensure animations use `requestAnimationFrame` not `setInterval`
- Disable unnecessary timers when app not in focus
- Profile with DevTools to find expensive operations
- Consider debouncing frequent events (like mouse move)

---

## 7. Network & API Issues

### Issue: CORS errors in browser console

**Symptoms**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:

1. Enable CORS in Flask:
   ```python
   from flask_cors import CORS
   CORS(app)
   ```
2. Or specify allowed origins:
   ```python
   CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])
   ```
3. Ensure request includes proper headers
4. Check API runs on correct port (default 5000)

---

### Issue: API timeout or connection refused

**Symptoms**: Network requests fail, console shows `ERR_CONNECTION_REFUSED`

**Solutions**:

1. Verify Flask server is running: `python api_server.py`
2. Check API URL in code matches running server: `http://localhost:5000`
3. Check firewall isn't blocking port 5000
4. For development, set longer timeout: `fetch(..., {timeout: 10000})`
5. Add error handling and user feedback for network failures

---

## 8. Debugging Tips

### Enable Verbose Logging

Add to main.js:

```javascript
// Enable debug logging
window.DEBUG = true;

// In modules, check before logging verbose info
if (window.DEBUG) {
  console.log("Detailed debug info:", data);
}
```

---

### Check Event Bus Activity

```javascript
// Subscribe to all events
eventBus.on("*", (eventName, data) => {
  console.log(`Event: ${eventName}`, data);
});
```

---

### Inspect IndexedDB

Open DevTools → Application tab → IndexedDB → Select database to browse stored data.

---

### Profile JavaScript

```javascript
// Use console.time for performance
console.time("game-init");
// ... code to profile
console.timeEnd("game-init");
```

---

### Monitor Memory Usage

DevTools → Memory tab → Take heap snapshot to find memory leaks.

---

## 9. Reporting Issues

When reporting a bug, include:

1. **Steps to reproduce** - Exact steps to trigger the issue
2. **Expected behavior** - What should happen
3. **Actual behavior** - What actually happened
4. **Browser & OS** - Browser name/version and operating system
5. **Console errors** - Full error message from DevTools Console
6. **Screenshots** - If visual issue
7. **Network requests** - Check DevTools Network tab for failed requests

Example:

```
Browser: Chrome 120.0.6099.71 on Windows 11
Issue: Game board not displaying for Connect 4
Steps:
1. Load app at localhost:5173
2. Click "Four in a Row" game
3. Wait 2 seconds
4. No board appears, console shows "ReferenceError: FourInARow is not defined"
```

---

## 10. Getting Help

- **Local testing**: Open DevTools (F12) and check Console/Network tabs
- **Check logs**: Look in browser console and Flask server terminal
- **Git branches**: Use `git diff` to see recent changes
- **Version check**: Run `npm --version` and `python --version` to verify tools
- **Clean build**: Delete node_modules and dist, then `npm install` and `npm run dev`

---

**Last Updated**: January 23, 2026  
**For more details**: See README.md and Architecture Documentation
