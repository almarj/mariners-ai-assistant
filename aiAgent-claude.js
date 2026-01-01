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
    // Use dataService to get current Mariners data (now includes playoff data)
    const { standings, players, last5, next5, playoff } = await dataService.getMarinersData();

    // Build playoff context if playoff games exist
    let playoffContext = '';
    if (playoff && playoff.games && playoff.games.length > 0) {
      playoffContext = `
2025 PLAYOFF GAMES:
${playoff.games.map(g => {
  const mariners = g.homeTeam.includes('Mariners') ? 'home' : 'away';
  const marinersScore = mariners === 'home' ? g.homeScore : g.awayScore;
  const opponentScore = mariners === 'home' ? g.awayScore : g.homeScore;
  const result = marinersScore > opponentScore ? 'W' : 'L';
  return `${g.seriesDescription} Game ${g.seriesGameNumber}: ${g.awayTeam} @ ${g.homeTeam} - ${result} ${g.awayScore}-${g.homeScore}`;
}).join("\n")}

PLAYOFF PLAYER STATS:
Top Playoff Hitters:
${players.players
  .filter(p => p.type !== "Pitcher" && p.playoff && p.playoff.gp && parseInt(p.playoff.gp) > 0)
  .slice(0, 5)
  .map(p => `${p.name}: ${p.playoff.gp} GP, AVG ${p.playoff.avg}, HR ${p.playoff.hr}, RBI ${p.playoff.rbi}`)
  .join("\n") || "No playoff hitting stats available"}

Top Playoff Pitchers:
${players.players
  .filter(p => p.type === "Pitcher" && p.playoff && p.playoff.gp && parseInt(p.playoff.gp) > 0)
  .slice(0, 5)
  .map(p => `${p.name}: ${p.playoff.gp} GP, W ${p.playoff.wins}, L ${p.playoff.losses}, ERA ${p.playoff.era}, K ${p.playoff.strikeouts}`)
  .join("\n") || "No playoff pitching stats available"}
`;
    }

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
${playoffContext}
TOP HITTERS (Regular Season):
${players.players
  .filter(p => p.type !== "Pitcher")
  .slice(0, 10)
  .map(p => `${p.name}: AVG ${p.avg}, HR ${p.hr}, RBI ${p.rbi}, SB ${p.sb}, Runs ${p.runs}`)
  .join("\n")}

TOP PITCHERS (Regular Season):
${players.players
  .filter(p => p.type === "Pitcher")
  .slice(0, 10)
  .map(p => `${p.name}: W ${p.wins}, L ${p.losses}, ERA ${p.era}, WHIP ${p.whip}, K ${p.strikeouts}, SV ${p.saves}`)
  .join("\n")}

User Question: ${userQuestion}

Please answer the question accurately using only the provided data. Be conversational and enthusiastic about the Mariners. If asked about playoff performance, use the playoff data above. If comparing regular season vs playoff performance, use both datasets. If asked about something not in the data, politely explain you don't have that information.
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
