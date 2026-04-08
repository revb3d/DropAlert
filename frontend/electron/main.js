const { app, BrowserWindow, shell, protocol, net } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const DIST = path.join(__dirname, '../dist');

// Prevent multiple instances
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// ─── Custom protocol: app://dropalert/ → serves dist/ ────────────────────────
// Using a custom protocol avoids file:// origin restrictions (CORS, localStorage,
// secure contexts) that would break the Expo web build.

app.whenReady().then(() => {
  protocol.handle('app', (request) => {
    let pathname = new URL(request.url).pathname;

    // Strip the leading /dropalert prefix used as the app host
    pathname = pathname.replace(/^\/dropalert/, '') || '/';

    const filePath = path.join(DIST, pathname === '/' ? 'index.html' : pathname);

    return net
      .fetch(pathToFileURL(filePath).href)
      .catch(() =>
        // Unknown path → return index.html (SPA client-side routing fallback)
        net.fetch(pathToFileURL(path.join(DIST, 'index.html')).href)
      );
  });

  createWindow();
});

// ─── Main window ──────────────────────────────────────────────────────────────

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 860,
    minHeight: 640,
    backgroundColor: '#0F0F14',
    title: 'DropAlert',
    // Use a real icon once you have one at assets/icon.png
    // icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,   // lets preload globals reach the renderer
      preload: path.join(__dirname, 'preload.js'),
      devTools: !app.isPackaged,
    },
  });

  // In development, load from the Expo Metro dev server.
  // In production (packaged .exe), load from the bundled static export.
  const url = app.isPackaged
    ? 'app://dropalert/index.html'
    : 'http://localhost:8081';
  win.loadURL(url);

  // Open all <a target="_blank"> and window.open() links in the OS browser,
  // not in a new Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Open DevTools automatically in development
  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.on('second-instance', () => {
  // If a second instance is launched, focus the existing window instead
  const [win] = BrowserWindow.getAllWindows();
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on('window-all-closed', () => {
  // On macOS apps stay open until the user explicitly quits
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  // macOS: re-create window when dock icon is clicked and no windows are open
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
