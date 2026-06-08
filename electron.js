const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');

// 1. Load environment variables
const isPackaged = app.isPackaged;
const possibleEnvPaths = [
    path.join(path.dirname(process.execPath), '.env'), // next to executable (production)
    path.join(process.cwd(), '.env'),                 // current working directory
    path.join(__dirname, '.env'),                      // next to electron.js
    path.join(__dirname, 'server', '.env')             // inside server directory
];

for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log(`Loaded environment variables from: ${envPath}`);
        break;
    }
}

// 2. Function to find a free port starting from a given port
function getFreePort(startPort) {
    return new Promise((resolve, reject) => {
        const checkPort = (port) => {
            const server = net.createServer();
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    checkPort(port + 1);
                } else {
                    reject(err);
                }
            });
            server.once('listening', () => {
                server.close(() => {
                    resolve(port);
                });
            });
            server.listen(port);
        };
        checkPort(startPort);
    });
}

let mainWindow;

async function createWindow() {
    let port = 5000;

    if (isPackaged) {
        // Find a free port dynamically for the Express server in production
        try {
            port = await getFreePort(5000);
        } catch (err) {
            console.error("Failed to find a free port:", err);
        }

        // Start the Express server internally
        process.env.PORT = port.toString();
        process.env.NODE_ENV = 'production';

        try {
            // Require the Express server index.js.
            // Note: server/index.js will run connectDB() and start listening on process.env.PORT
            require('./server/index.js');
        } catch (err) {
            dialog.showErrorBox(
                'Backend Server Failure',
                `Failed to start the Express backend server:\n\n${err.message}`
            );
        }
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    if (isPackaged) {
        mainWindow.loadURL(`http://localhost:${port}`);
    } else {
        // In development, load the React Vite dev server
        mainWindow.loadURL('http://localhost:5174');
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Disable hardware acceleration if crashes occur on startup (GPU compatibility)
// app.disableHardwareAcceleration();

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }

});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});