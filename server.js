// ALGOMENTOR backend: Node.js + Express
const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");

// Load a local .env file if present (for testing on your own PC)
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/algorithms", require("./routes/algorithms"));
app.use("/api/quiz", require("./routes/quiz"));
app.use("/api/ai", require("./routes/ai"));

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", aiKeyConfigured: Boolean(process.env.GEMINI_API_KEY) })
);

// Serve the frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`ALGOMENTOR running at http://localhost:${PORT}`));
}
module.exports = app;
