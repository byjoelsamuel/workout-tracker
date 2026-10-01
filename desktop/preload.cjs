// The only thing the page learns about being inside the desktop app is that
// it is. No Node, no file system, no IPC — the page is the same code as the
// website and needs nothing more. (The version shown in About comes from the
// build, which reads the same package.json.)
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("tsyoku", { desktop: true });
