const {contextBridge, ipcRenderer} = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    generateCode: (prompt) => ipcRenderer.sendSync('generate-code', prompt),
    storeHTML: (html) => ipcRenderer.send('store-html', html),
    getHTML: () => ipcRenderer.sendSync('get-html'),
    getText: () => ipcRenderer.sendSync('get-text')
})