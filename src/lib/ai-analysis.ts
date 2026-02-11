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
  username: string,
  onProgress?: (gameIndex: number, total: number) => void
): Promise<{ perGame: { pgn: string; eval: GameEvaluation }[]; structured: any }> {
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
    return { perGame: [], structured: null };
  }

  // Pre-classify mistakes across all games with FENs
  const allMistakes: any[] = [];
  for (let gi = 0; gi < results.length; gi++) {
    const r = results[gi];
    const game = gamesToAnalyze[gi];
    const isWhite = game.white?.username?.toLowerCase() === username?.toLowerCase();
    const playerColor = isWhite ? "w" : "b";

    for (let i = 1; i < r.eval.moves.length; i++) {
      const m = r.eval.moves[i];
      if (m.color !== playerColor) continue; // only player's mistakes

      const prev = r.eval.moves[i - 1];
      const cpBefore = m.color === "w" ? prev.score : -prev.score;
      const cpAfter = m.color === "w" ? m.score : -m.score;
      const cpLoss = cpBefore - cpAfter;

      if (cpLoss >= 50) {
        allMistakes.push({
          game: gi + 1,
          moveNumber: m.moveNumber,
          color: m.color,
          played: m.san,
          bestMove: m.bestMoveSan || "unknown",
          fen: m.fen,
          cpLoss: Math.round(cpLoss),
          classification: cpLoss >= 300 ? "blunder" : cpLoss >= 100 ? "mistake" : "inaccuracy",
          phase: m.moveNumber <= 12 ? "opening" : m.moveNumber <= 30 ? "middlegame" : "endgame",
        });
      }
    }
  }

  return {
    perGame: results,
    structured: {
      gamesAnalyzed: results.length,
      totalMistakes: allMistakes.length,
      blunders: allMistakes.filter(m => m.classification === "blunder").length,
      mistakes: allMistakes.filter(m => m.classification === "mistake").length,
      inaccuracies: allMistakes.filter(m => m.classification === "inaccuracy").length,
      byPhase: {
        opening: allMistakes.filter(m => m.phase === "opening").length,
        middlegame: allMistakes.filter(m => m.phase === "middlegame").length,
        endgame: allMistakes.filter(m => m.phase === "endgame").length,
      },
      details: allMistakes.slice(0, 20), // cap to avoid token bloat
      depth: 16,
    },
  };
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
  let engineData: { structured: any } = { structured: null };
  try {
    engineData = await batchEngineAnalysis(games, username, onEngineProgress);
  } catch (err) {
    console.warn("Batch engine analysis failed:", err);
  }

  // Phase 2: Send to AI with structured engine data
  onPhaseChange?.("ai");
  const { data, error } = await supabase.functions.invoke("analyze-chess", {
    body: { username, stats, games, engineAnalysis: engineData.structured },
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
