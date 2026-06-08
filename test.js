console.log("Electron test");
const { app } = require("electron");

app.whenReady().then(() => {
    console.log("App Ready");
});