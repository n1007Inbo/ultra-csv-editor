import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  readChunk: (filePath: string) => ipcRenderer.invoke('file:readChunk', filePath),
  saveFile: (filePath: string, content: string) => ipcRenderer.invoke('file:saveFile', { filePath, content }),
  saveFileAs: (defaultName: string) => ipcRenderer.invoke('dialog:saveFileAs', defaultName),
});
