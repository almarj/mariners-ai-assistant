const express = require("express");
const router = express.Router();
const Anthropic = require("@anthropic-ai/sdk");
const dataService = require("./dataService");
require("dotenv").config();

console.log("📦 aiAgent-claude.js loaded");

// Init Anthropic (Claude)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

router.post("/", async (req, res) => {
  console.log("✅ /ask route hit");

  const userQuestion = req.body.question;
  if (!userQuestion) {
    return res.status(400).json({ error: "No question provided." });
  }

  try {
    // Use dataService to get current Mariners data
    const { standings, players, last5, next5 } = await dataService.getMarinersData();

    const context = `
You are a knowledgeable Seattle Mariners assistant. Answer questions about the team using the following current data:

STANDINGS:
AL West: ${standings.alWest.map(t => `${t.teamName} (${t.wins}-${t.losses}, ${t.gamesBack} GB)`).join(", ")}

AL Wild Card Standings:
${standings.alWildCard.map(t => `${t.teamName} (${t.wins}-${t.losses}, WC Rank: ${t.wildCardRank}, ${t.wildCardGamesBack} GB)`).join("\n")}

RECENT GAMES (Last 5):
${last5.games.map(g => `${g.awayTeam} @ ${g.homeTeam} - Final: ${g.awayScore}-${g.homeScore}`).join("\n")}

UPCOMING GAMES (Next 5):
${next5.games.map(g => `${g.awayTeam} @ ${g.homeTeam} on ${new Date(g.gameDate).toLocaleDateString()}`).join("\n")}

TOP HITTERS:
${players.players
  .filter(p => p.type !== "Pitcher")
  .slice(0, 10)
  .map(p => `${p.name}: AVG ${p.avg}, HR ${p.hr}, RBI ${p.rbi}, SB ${p.sb}, Runs ${p.runs}`)
  .join("\n")}

TOP PITCHERS:
${players.players
  .filter(p => p.type === "Pitcher")
  .slice(0, 10)
  .map(p => `${p.name}: W ${p.wins}, L ${p.losses}, ERA ${p.era}, WHIP ${p.whip}, K ${p.strikeouts}, SV ${p.saves}`)
  .join("\n")}

User Question: ${userQuestion}

Please answer the question accurately using only the provided data. Be conversational and enthusiastic about the Mariners. If asked about something not in the data, politely explain you don't have that information.
`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        { 
          role: "user", 
          content: context
        }
      ]
    });

    const answer = response.content[0]?.text || "No answer available.";
    res.json({ answer });

  } catch (error) {
    console.error("❌ AI error:", error);
    
    // Send more helpful error message
    const errorMessage = error.message.includes("API key") || error.status === 401
      ? "Anthropic API key not configured. Please set ANTHROPIC_API_KEY in .env file."
      : `Failed to get AI response: ${error.message}`;
    
    res.status(500).json({ error: errorMessage });
  }
});

module.exports = router;
