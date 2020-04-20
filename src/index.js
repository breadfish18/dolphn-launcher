const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');
const {
  Authenticator
} = require("minecraft-launcher-core");
const path = require('path');
const fs = require('fse');
const client = require('discord-rich-presence')('701872506826653808');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 350,
    frame: false,
    maximizable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  if (!fs.existsSync(path.join(__dirname, "../../../", "user_cache.json"))) await fs.writeFile(path.join(__dirname, "../../../", "user_cache.json"), `{"clientToken": null, "accessToken": null}`)
  const file = JSON.parse(fs.readFileSync(path.join(__dirname, "../../../", "user_cache.json")))
  if (!file.clientToken || !file.accessToken) {
    mainWindow.loadFile(path.join(__dirname, 'login.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
    client.updatePresence({
      state: 'Idle',
      startTimestamp: Date.now(),
      largeImageKey: 'large',
      instance: true,
    });
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('status', (event, arg) => {
  if (arg === "loaded") {
    client.updatePresence({
      state: 'playing sanctuary',
      startTimestamp: Date.now(),
      largeImageKey: 'large',
      instance: true,
    });
    event.returnValue = "set";
  } else if (arg === "exit") {
    client.updatePresence({
      state: 'idle',
      startTimestamp: Date.now(),
      largeImageKey: 'large',
      instance: true,
    });
    event.returnValue = "set";
  } else if (arg === "launching") {
    client.updatePresence({
      state: 'launching',
      startTimestamp: Date.now(),
      largeImageKey: 'large',
      instance: true,
    });
    event.returnValue = "set";
  }
})
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.