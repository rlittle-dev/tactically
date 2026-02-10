/**
 * Evaluates all positions in a PGN using chess-api.com via edge function.
 * Returns per-move evaluations (scores, best moves) for the eval chart and AI summary.
 */

import { Chess } from "chess.js";
import { supabase } from "@/integrations/supabase/client";

export interface EvaluatedMove {
  fen: string;
  moveNumber: number;
  move: string;
  san: string;
  score: number; // centipawns from white's perspective
  winChance: number; // 0-100 from white's perspective
  bestMove: string | null;
  bestMoveSan: string | null;
  depth: number;
  mate: number | null;
  color: "w" | "b";
}

export interface GameEvaluation {
  moves: EvaluatedMove[];
  summary: string;
}

export async function evaluateGame(
  pgn: string,
  onProgress?: (current: number, total: number) => void,
): Promise<GameEvaluation> {
  const chess = new Chess();

  try {
    chess.loadPgn(pgn);
  } catch {
    throw new Error("Invalid PGN format");
  }

  const history = chess.history({ verbose: true });
  if (history.length === 0) throw new Error("No moves found in PGN");

  // Build all FENs (starting position + after each move)
  const replayChess = new Chess();
  const positions: { fen: string }[] = [{ fen: replayChess.fen() }];

  for (const move of history) {
    replayChess.move(move.san);
    positions.push({ fen: replayChess.fen() });
  }

  // Send all positions to the edge function in batches
  const BATCH_SIZE = 15;
  const allResults: any[] = [];

  for (let batchStart = 0; batchStart < positions.length; batchStart += BATCH_SIZE) {
    const batch = positions.slice(batchStart, batchStart + BATCH_SIZE);

    const { data, error } = await supabase.functions.invoke("chess-eval", {
      body: { positions: batch },
    });

    if (error) throw new Error(`Engine evaluation failed: ${error.message}`);
    if (data?.error) throw new Error(data.error);

    allResults.push(...(data.results || []));

    // Report progress
    const done = Math.min(batchStart + BATCH_SIZE, positions.length);
    onProgress?.(Math.min(done - 1, history.length), history.length);
  }

  // First result is the starting position
  const startEval = allResults[0];
  if (!startEval || startEval.error) {
    throw new Error(`Failed to evaluate starting position: ${startEval?.error || "no data"}`);
  }

  const evaluatedMoves: EvaluatedMove[] = [];

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const wasWhiteTurn = i % 2 === 0;
    const evalData = allResults[i + 1];

    if (!evalData || evalData.error) continue;

    evaluatedMoves.push({
      fen: positions[i + 1].fen,
      moveNumber: Math.floor(i / 2) + 1,
      move: move.san,
      san: move.san,
      score: Math.round(evalData.eval * 100),
      winChance: evalData.winChance,
      bestMove: evalData.move || null,
      bestMoveSan: evalData.san || null,
      depth: evalData.depth,
      mate: evalData.mate,
      color: wasWhiteTurn ? "w" : "b",
    });
  }

  // Generate summary for AI coaching (eval swings, big drops, etc.)
  const summaryLines = [`Stockfish 17 NNUE analysis (depth 16):`];

  // Find big eval swings (>1 pawn change) to highlight for the AI
  const prevScores = [Math.round(startEval.eval * 100), ...evaluatedMoves.map((m) => m.score)];
  const bigSwings: string[] = [];

  for (let i = 0; i < evaluatedMoves.length; i++) {
    const m = evaluatedMoves[i];
    const cpBefore = m.color === "w" ? prevScores[i] : -prevScores[i];
    const cpAfter = m.color === "w" ? prevScores[i + 1] : -prevScores[i + 1];
    const cpLoss = cpBefore - cpAfter;

    if (cpLoss >= 100) {
      bigSwings.push(
        `${m.moveNumber}${m.color === "w" ? "." : "..."} ${m.san} lost ${Math.round(cpLoss / 100 * 10) / 10} pawns` +
        (m.bestMoveSan ? ` (best was ${m.bestMoveSan})` : "")
      );
    }
  }

  if (bigSwings.length > 0) {
    summaryLines.push(`Significant errors (≥1 pawn loss): ${bigSwings.join("; ")}`);
  } else {
    summaryLines.push("No major blunders detected (no single move lost ≥1 pawn).");
  }

  return { moves: evaluatedMoves, summary: summaryLines.join("\n") };
}
