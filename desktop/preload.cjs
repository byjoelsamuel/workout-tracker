// What the page learns about being inside the desktop app: that it is, and
// two calls for updates. No Node, no file system, and no way to hand the main
// process a URL — checkForUpdate asks GitHub for the latest release, and
// downloadUpdate opens whatever download that answer named. (The version shown
// in About comes from the build, which reads the same package.json.)
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tsyoku", {
  desktop: true,
  checkForUpdate: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
});
