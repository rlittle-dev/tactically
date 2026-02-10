export interface ChessProfile {
  username: string;
  avatar?: string;
  name?: string;
  country?: string;
  joined: number;
  last_online: number;
  followers: number;
  status: string;
}

export interface ChessStats {
  chess_rapid?: TimeControlStats;
  chess_blitz?: TimeControlStats;
  chess_bullet?: TimeControlStats;
  tactics?: { highest?: { rating: number }; lowest?: { rating: number } };
  puzzle_rush?: { best?: { score: number } };
}

export interface TimeControlStats {
  last: { rating: number; date: number };
  best: { rating: number; date: number };
  record: { win: number; loss: number; draw: number };
}

export interface RecentGame {
  url: string;
  time_control: string;
  rated: boolean;
  white: GamePlayer;
  black: GamePlayer;
  end_time: number;
  time_class: string;
  pgn?: string;
}

interface GamePlayer {
  username: string;
  rating: number;
  result: string;
}

const BASE = "https://api.chess.com/pub/player";

export async function fetchProfile(username: string): Promise<ChessProfile> {
  const res = await fetch(`${BASE}/${username}`);
  if (!res.ok) throw new Error("Player not found");
  return res.json();
}

export async function fetchStats(username: string): Promise<ChessStats> {
  const res = await fetch(`${BASE}/${username}/stats`);
  if (!res.ok) throw new Error("Could not fetch stats");
  return res.json();
}

export async function fetchRecentGames(username: string): Promise<RecentGame[]> {
  const archiveRes = await fetch(`${BASE}/${username}/games/archives`);
  if (!archiveRes.ok) return [];
  const { archives } = await archiveRes.json();
  if (!archives || archives.length === 0) return [];

  const latestUrl = archives[archives.length - 1];
  const gamesRes = await fetch(latestUrl);
  if (!gamesRes.ok) return [];
  const { games } = await gamesRes.json();
  return (games || []).slice(-10).reverse();
}

export function getResult(game: RecentGame, username: string): "win" | "loss" | "draw" {
  const lower = username.toLowerCase();
  const isWhite = game.white.username.toLowerCase() === lower;
  const playerResult = isWhite ? game.white.result : game.black.result;
  if (playerResult === "win") return "win";
  if (["checkmated", "timeout", "resigned", "abandoned"].includes(playerResult)) return "loss";
  return "draw";
}

export function getPlayerRating(game: RecentGame, username: string): number {
  const lower = username.toLowerCase();
  return game.white.username.toLowerCase() === lower ? game.white.rating : game.black.rating;
}

export function getOpponentName(game: RecentGame, username: string): string {
  const lower = username.toLowerCase();
  return game.white.username.toLowerCase() === lower ? game.black.username : game.white.username;
}

export function getOpponentRating(game: RecentGame, username: string): number {
  const lower = username.toLowerCase();
  return game.white.username.toLowerCase() === lower ? game.black.rating : game.white.rating;
}

export function analyzeWeaknesses(stats: ChessStats): { area: string; detail: string; severity: "high" | "medium" | "low" }[] {
  const insights: { area: string; detail: string; severity: "high" | "medium" | "low" }[] = [];

  const controls = [
    { key: "chess_rapid" as const, label: "Rapid" },
    { key: "chess_blitz" as const, label: "Blitz" },
    { key: "chess_bullet" as const, label: "Bullet" },
  ];

  // Find weakest time control
  const ratings = controls
    .filter((c) => stats[c.key]?.last)
    .map((c) => ({ label: c.label, rating: stats[c.key]!.last.rating }));

  if (ratings.length >= 2) {
    ratings.sort((a, b) => a.rating - b.rating);
    const gap = ratings[ratings.length - 1].rating - ratings[0].rating;
    if (gap > 150) {
      insights.push({
        area: `${ratings[0].label} is your weakest format`,
        detail: `Your ${ratings[0].label} rating (${ratings[0].rating}) trails your ${ratings[ratings.length - 1].label} (${ratings[ratings.length - 1].rating}) by ${gap} points. Focus practice here.`,
        severity: gap > 300 ? "high" : "medium",
      });
    }
  }

  // Loss rate analysis
  for (const c of controls) {
    const record = stats[c.key]?.record;
    if (!record) continue;
    const total = record.win + record.loss + record.draw;
    if (total < 10) continue;
    const lossRate = record.loss / total;
    if (lossRate > 0.5) {
      insights.push({
        area: `High loss rate in ${c.label}`,
        detail: `You've lost ${(lossRate * 100).toFixed(0)}% of your ${c.label} games. Consider studying openings and endgame patterns.`,
        severity: "high",
      });
    } else if (lossRate > 0.4) {
      insights.push({
        area: `Moderate loss rate in ${c.label}`,
        detail: `${(lossRate * 100).toFixed(0)}% losses in ${c.label}. Analyzing your lost games could reveal patterns.`,
        severity: "medium",
      });
    }
  }

  // Draw rate
  for (const c of controls) {
    const record = stats[c.key]?.record;
    if (!record) continue;
    const total = record.win + record.loss + record.draw;
    if (total < 20) continue;
    const drawRate = record.draw / total;
    if (drawRate < 0.05) {
      insights.push({
        area: `Very few draws in ${c.label}`,
        detail: `Only ${(drawRate * 100).toFixed(1)}% draws suggests games are decisive—practice defending worse positions to salvage half-points.`,
        severity: "low",
      });
    }
  }

  // Puzzle rating vs game rating
  const puzzleRating = stats.tactics?.highest?.rating;
  if (puzzleRating && ratings.length > 0) {
    const avgGameRating = ratings.reduce((a, b) => a + b.rating, 0) / ratings.length;
    if (puzzleRating > avgGameRating + 400) {
      insights.push({
        area: "Tactics knowledge isn't translating",
        detail: `Your puzzle rating (${puzzleRating}) is much higher than your game ratings. Work on time management and applying tactics under pressure.`,
        severity: "medium",
      });
    } else if (puzzleRating < avgGameRating - 200) {
      insights.push({
        area: "Tactical vision needs work",
        detail: `Your puzzle rating (${puzzleRating}) lags behind your game play. Daily puzzle practice will sharpen pattern recognition.`,
        severity: "high",
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      area: "Keep it up!",
      detail: "No major weaknesses detected. Continue playing and analyzing your games to improve further.",
      severity: "low",
    });
  }

  return insights;
}
