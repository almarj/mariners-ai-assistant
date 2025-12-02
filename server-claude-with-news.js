const express = require("express");
const cors = require("cors");
const path = require("path");
const dataService = require("./dataService");
const newsService = require("./newsService");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Mount AI Agent route (Claude version)
try {
  const aiAgentRoute = require("./aiAgent-claude");
  app.use("/ask", aiAgentRoute);
  console.log("✅ /ask route mounted (Claude-powered)");
} catch (err) {
  console.error("❌ Failed to load aiAgent-claude.js", err);
}

// Use dataService for stats endpoints
app.get("/last5", async (req, res) => {
  try {
    const data = await dataService.getLastFiveGames();
    res.json(data);
  } catch (err) {
    console.error("Error in /last5:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/next5", async (req, res) => {
  try {
    const data = await dataService.getNextFiveGames();
    res.json(data);
  } catch (err) {
    console.error("Error in /next5:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/standings", async (req, res) => {
  try {
    const data = await dataService.getStandings();
    res.json(data);
  } catch (err) {
    console.error("Error in /standings:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/players", async (req, res) => {
  try {
    const data = await dataService.getPlayers();
    res.json(data);
  } catch (err) {
    console.error("Error in /players:", err);
    res.status(500).json({ error: err.message });
  }
});

// NEW: News endpoint
app.get("/news", async (req, res) => {
  try {
    const data = await newsService.getMarinersNews();
    res.json(data);
  } catch (err) {
    console.error("Error in /news:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    ai: "Claude (Anthropic)"
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`AI Provider: Claude (Anthropic)`);
});
