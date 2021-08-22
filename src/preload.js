// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.

const { electron, contextBridge, ipcRenderer } = require('electron')


https://stevenklambert.com/writing/comprehensive-guide-building-packaging-electron-app/

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
    'api', {
    send: (channel, data) => {
        ipcRenderer.send(channel, data);
    },
    receive: (channel, func) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
}
);