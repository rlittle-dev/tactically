import { supabase } from "@/integrations/supabase/client";
import type { ChessStats, RecentGame } from "./chess-api";
import { evaluateGame, GameEvaluation } from "./game-evaluator";

export interface AIAnalysis {
  weaknesses: {
    category: string;
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    lichess_themes: string[];
  }[];
  strengths: {
    title: string;
    description: string;
  }[];
  overall_assessment: string;
  recommended_puzzles: {
    theme: string;
    label: string;
    reason: string;
  }[];
}

/**
 * Run Stockfish evaluation on up to N recent games to produce aggregate engine data.
 * Uses lower depth (10) for speed since we're doing multiple games.
 */
async function batchEngineAnalysis(
  games: RecentGame[],
  onProgress?: (gameIndex: number, total: number) => void
): Promise<{ perGame: { pgn: string; eval: GameEvaluation }[]; aggregate: string }> {
  const gamesToAnalyze = games.filter((g) => g.pgn).slice(0, 5);
  const results: { pgn: string; eval: GameEvaluation }[] = [];

  for (let i = 0; i < gamesToAnalyze.length; i++) {
    onProgress?.(i + 1, gamesToAnalyze.length);
    try {
      const evalResult = await evaluateGame(gamesToAnalyze[i].pgn);
      results.push({ pgn: gamesToAnalyze[i].pgn, eval: evalResult });
    } catch (err) {
      console.warn(`Engine eval failed for game ${i + 1}:`, err);
    }
  }

  if (results.length === 0) {
    return { perGame: [], aggregate: "Engine analysis unavailable." };
  }

  const lines = [
    `Stockfish engine analysis of ${results.length} recent games (depth 16):`,
    `Per-game breakdown:`,
  ];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    // Find big eval swings (≥1 pawn loss)
    const bigErrors = r.eval.moves.filter((m, idx) => {
      if (idx === 0) return false;
      const prevScore = idx > 0 ? r.eval.moves[idx - 1].score : 0;
      const cpBefore = m.color === "w" ? prevScore : -prevScore;
      const cpAfter = m.color === "w" ? m.score : -m.score;
      return (cpBefore - cpAfter) >= 100;
    });
    lines.push(
      `  Game ${i + 1}: ${bigErrors.length} significant errors (≥1 pawn loss)` +
      (bigErrors.length > 0
        ? ` — at: ${bigErrors.map((b) => `${b.moveNumber}${b.color === "w" ? "." : "..."} ${b.san}`).join(", ")}`
        : "")
    );
  }

  return { perGame: results, aggregate: lines.join("\n") };
}

export async function fetchAIAnalysis(
  username: string,
  stats: ChessStats,
  games: RecentGame[],
  onEngineProgress?: (gameIndex: number, total: number) => void,
  onPhaseChange?: (phase: "engine" | "ai") => void
): Promise<AIAnalysis> {
  // Phase 1: Run Stockfish batch analysis on recent games
  onPhaseChange?.("engine");
  let engineData: { aggregate: string } = { aggregate: "" };
  try {
    engineData = await batchEngineAnalysis(games, onEngineProgress);
  } catch (err) {
    console.warn("Batch engine analysis failed:", err);
  }

  // Phase 2: Send to AI with engine data
  onPhaseChange?.("ai");
  const { data, error } = await supabase.functions.invoke("analyze-chess", {
    body: { username, stats, games, engineAnalysis: engineData.aggregate },
  });

  if (error) {
    console.error("AI analysis error:", error);
    throw new Error(error.message || "AI analysis failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AIAnalysis;
}
