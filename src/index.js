const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const rfExplorerSerial = require('./rfexplorer.js');

let mainWindow = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}


const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    useContentSize: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
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

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.


// HERE


const rfExp = require("./rfexplorer.js");
let rfExplorer = new rfExp();


// mainWindow.webContents.send("portList", serverList);


function sendUpdatedPortList(data) {
  mainWindow.webContents.send("portList", data);
}
function updatePortList() {
  rfExplorer.listPorts(sendUpdatedPortList);
  setTimeout(updatePortList, 2000);
}

setTimeout(updatePortList, 2000);


function rfDataCallback(explorerData) {
  mainWindow.webContents.send("sweepData", explorerData);
}

function configCallBack(startFreq, freqStep, ampTop, ampBottom, sweepPoints) {
  mainWindow.webContents.send("explorerConfig", { startFreq, freqStep, ampTop, ampBottom, sweepPoints });
}

//this.configCallBack(startFreq, freqStep, ampTop, ampBottom);



ipcMain.on("rfExp", (event, command) => {
  switch (command[0]) {
    case "connect":
      rfExplorer.connect(command[1]);
      rfExplorer.setReceiveCallback(rfDataCallback)
      // rfExplorer.set
      break;
    case "reboot":
      rfExplorer.reboot();
      break;
    case "getSerial":
      rfExplorer.getSerial();
      break;
    case "getConfig":
      rfExplorer.requestConfig(configCallBack);
      break;
    case "changeConfig":
      rfExplorer.analyzerConfig(command[1], command[2], 0, -110); // unsure about level settings
    default:
      console.log("unimplemented:")
      console.log(command);
  }
});
