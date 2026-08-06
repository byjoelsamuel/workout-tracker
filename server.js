// Local dev convenience only. The app itself is fully static — every
// page persists data to the browser's localStorage (see public/store.js)
// so it can be hosted on GitHub Pages with no server at all. This just
// serves the public/ folder so `npm start` still works for local preview.
const express = require("express");
const path = require("node:path");

const app = express();
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Workout Tracker running at http://localhost:${PORT}`);
});
