const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const net = require('net');


process.on('uncaughtException', (error) => {
    console.error('Electron Uncaught Exception:', error);
    try {
        fs.appendFileSync(path.join(process.cwd(), 'electron-error.log'), `${new Date().toISOString()} - Uncaught Exception: ${error.stack || error}\n`);
    } catch (e) { }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Electron Unhandled Rejection:', reason);
    try {
        fs.appendFileSync(path.join(process.cwd(), 'electron-error.log'), `${new Date().toISOString()} - Unhandled Rejection: ${reason}\n`);
    } catch (e) { }
});


const isPackaged = app.isPackaged;
const possibleEnvPaths = [
    path.join(path.dirname(process.execPath), '.env'), 
    path.join(process.cwd(), '.env'),                 
    path.join(__dirname, '.env'),                      
    path.join(__dirname, 'server', '.env')             
];

for (const envPath of possibleEnvPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log(`Loaded environment variables from: ${envPath}`);
        break;
    }
}


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


function getActiveDevPort() {
    return new Promise((resolve) => {
        const ports = [5173, 5174, 5175];
        let checked = 0;
        let resolved = false;

        ports.forEach(port => {
            const socket = new net.Socket();
            socket.setTimeout(250); 

            socket.once('connect', () => {
                socket.destroy();
                if (!resolved) {
                    resolved = true;
                    resolve(port);
                }
            });

            const handleFailure = () => {
                socket.destroy();
                checked++;
                if (checked === ports.length && !resolved) {
                    resolved = true;
                    resolve(5173); 
                }
            };

            socket.once('timeout', handleFailure);
            socket.once('error', handleFailure);

            socket.connect(port, '127.0.0.1');
        });
    });
}

let mainWindow;

async function createWindow() {
    let port = 5000;

    if (isPackaged) {
        
        try {
            port = await getFreePort(5000);
        } catch (err) {
            console.error("Failed to find a free port:", err);
        }

        
        process.env.PORT = port.toString();
        process.env.NODE_ENV = 'production';

        try {
            
            
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
        try {
            const devPort = await getActiveDevPort();
            console.log(`Connecting Electron window to Vite dev server on port: ${devPort}`);
            mainWindow.loadURL(`http://localhost:${devPort}`);
        } catch (e) {
            console.error('Failed to resolve Vite dev port:', e);
            mainWindow.loadURL('http://localhost:5173');
        }
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}



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