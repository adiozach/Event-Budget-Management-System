// No privileged APIs are exposed to the renderer; the app talks to
// Supabase directly over HTTPS from the renderer using the anon key.
const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('appInfo', { platform: process.platform });
