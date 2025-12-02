/**
 * Shared data service for fetching MLB API data
 * Updated for Seattle Mariners (team ID 136)
 */

async function getLastFiveGames() {
  try {
    // Use dynamic import for node-fetch in production
    const fetch = (await import('node-fetch')).default;
    
    // Use 2025 season - playoffs ended in October 2025
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=136&season=2025&startDate=2025-09-01&endDate=2025-10-31`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`MLB API error: ${response.status}`);
      return { games: [] };
    }
    
    const data = await response.json();

    if (!data.dates || data.dates.length === 0) {
      return { games: [] };
    }

    const games = data.dates
      .flatMap(d => d.games || [])
      .filter(g => g.status && g.status.detailedState === "Final")
      .slice(-5)
      .reverse()
      .map(game => ({
        homeTeam: game.teams?.home?.team?.name || "Unknown",
        awayTeam: game.teams?.away?.team?.name || "Unknown",
        homeScore: game.teams?.home?.score || 0,
        awayScore: game.teams?.away?.score || 0,
        venue: game.venue?.name || "Unknown Venue",
        gameDate: game.gameDate || new Date().toISOString()
      }));

    return { games };
  } catch (err) {
    console.error("Error fetching last5 games:", err.message);
    return { games: [] };
  }
}

async function getNextFiveGames() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Spring training 2026 starts in February
    const year = 2026;
    const startDate = "2026-02-01";
    const endDate = "2026-04-30";
    
    const url = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=136&season=${year}&startDate=${startDate}&endDate=${endDate}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`MLB API error: ${response.status}`);
      return { games: [] };
    }
    
    const data = await response.json();

    if (!data.dates || data.dates.length === 0) {
      return { games: [] };
    }

    const games = data.dates
      .flatMap(d => d.games || [])
      .slice(0, 5)
      .map(game => ({
        homeTeam: game.teams?.home?.team?.name || "Unknown",
        awayTeam: game.teams?.away?.team?.name || "Unknown",
        venue: game.venue?.name || "Unknown Venue",
        gameDate: game.gameDate || new Date().toISOString()
      }));

    return { games };
  } catch (err) {
    console.error("Error fetching next5 games:", err.message);
    return { games: [] };
  }
}

async function getStandings() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Use 2025 season (most recent completed season)
    const year = 2025;
    
    // Fetch division standings
    const divisionUrl = `https://statsapi.mlb.com/api/v1/standings?leagueId=103&season=${year}&standingsTypes=regularSeason`;
    
    const divisionRes = await fetch(divisionUrl);
    if (!divisionRes.ok) {
      throw new Error(`Division API error: ${divisionRes.status}`);
    }
    
    const divisionData = await divisionRes.json();

    if (!divisionData.records || divisionData.records.length === 0) {
      throw new Error("No division records found");
    }

    // Find AL West (division ID 200)
    const division = divisionData.records.find(r => r.division && r.division.id === 200);
    
    if (!division || !division.teamRecords) {
      throw new Error("AL West division not found");
    }

    const alWest = division.teamRecords.map(team => ({
      teamName: team.team?.name || "Unknown",
      wins: team.wins || 0,
      losses: team.losses || 0,
      pct: team.winningPercentage || ".000",
      divisionRank: team.divisionRank || "-",
      gamesBack: team.gamesBack || "0"
    }));

    // Fetch wild card standings
    const wildCardUrl = `https://statsapi.mlb.com/api/v1/standings/wildCard?leagueId=103&season=${year}`;
    
    const wildCardRes = await fetch(wildCardUrl);
    if (!wildCardRes.ok) {
      throw new Error(`Wild card API error: ${wildCardRes.status}`);
    }
    
    const wildCardData = await wildCardRes.json();

    let alWildCard = [];
    if (wildCardData.records && wildCardData.records.length > 0 && wildCardData.records[0].teamRecords) {
      alWildCard = wildCardData.records[0].teamRecords.map(team => ({
        teamName: team.team?.name || "Unknown",
        wins: team.wins || 0,
        losses: team.losses || 0,
        pct: team.winningPercentage || ".000",
        wildCardRank: team.wildCardRank || "-",
        wildCardGamesBack: team.wildCardGamesBack || "0"
      }));
    }

    return { alWest, alWildCard };
  } catch (err) {
    console.error("Error fetching standings:", err.message);
    throw new Error(`Failed to load standings: ${err.message}`);
  }
}

async function getPlayers() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const year = 2025; // Use 2025 season stats (most recent)
    
    const rosterRes = await fetch(`https://statsapi.mlb.com/api/v1/teams/136/roster`);
    
    if (!rosterRes.ok) {
      throw new Error(`Roster API error: ${rosterRes.status}`);
    }
    
    const roster = await rosterRes.json();

    if (!roster.roster || roster.roster.length === 0) {
      throw new Error("No roster data found");
    }

    const ids = roster.roster.map(player => player.person?.id).filter(id => id);
    
    const stats = await Promise.all(
      ids.map(async id => {
        try {
          const res = await fetch(`https://statsapi.mlb.com/api/v1/people/${id}/stats?stats=season&season=${year}`);
          if (!res.ok) return {};
          return await res.json();
        } catch (err) {
          console.error(`Player ${id} fetch failed:`, err.message);
          return {};
        }
      })
    );

    const players = roster.roster.map((player, i) => {
      const stat = stats[i]?.stats?.[0]?.splits?.[0]?.stat || {};
      return {
        name: player.person?.fullName || "Unknown",
        type: player.position?.type || "Unknown",
        avg: stat.avg || "-",
        runs: stat.runs || "-",
        hr: stat.homeRuns || "-",
        rbi: stat.rbi || "-",
        sb: stat.stolenBases || "-",
        gp: stat.gamesPlayed || "-",
        wins: stat.wins || "-",
        losses: stat.losses || "-",
        era: stat.era || "-",
        whip: stat.whip || "-",
        strikeouts: stat.strikeOuts || "-",
        saves: stat.saves || "-"
      };
    });

    return { players };
  } catch (err) {
    console.error("Error fetching players:", err.message);
    throw new Error(`Failed to load player stats: ${err.message}`);
  }
}

async function getMarinersData() {
  try {
    const [standings, players, last5, next5] = await Promise.all([
      getStandings(),
      getPlayers(),
      getLastFiveGames(),
      getNextFiveGames()
    ]);

    return { standings, players, last5, next5 };
  } catch (err) {
    console.error("Error fetching Mariners data:", err.message);
    throw err;
  }
}

module.exports = {
  getLastFiveGames,
  getNextFiveGames,
  getStandings,
  getPlayers,
  getMarinersData
};
