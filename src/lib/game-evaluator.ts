/**
 * Evaluates all positions in a PGN using chess-api.com via edge function.
 * Returns evaluations, classifications, and accuracy for each move.
 */

import { Chess } from "chess.js";
import { supabase } from "@/integrations/supabase/client";

export interface MoveClassification {
  type: "blunder" | "mistake" | "inaccuracy" | "good" | "excellent" | "brilliant" | "book";
  winProbLoss: number;
}

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
  classification: MoveClassification;
  color: "w" | "b";
}

export interface GameEvaluation {
  moves: EvaluatedMove[];
  accuracy: { white: number; black: number };
  summary: string;
}

/**
 * Classify a move based on Win% loss from the moving player's perspective.
 */
function classifyMove(winBefore: number, winAfter: number): MoveClassification {
  const winProbLoss = winBefore - winAfter;

  if (winProbLoss >= 20) return { type: "blunder", winProbLoss };
  if (winProbLoss >= 10) return { type: "mistake", winProbLoss };
  if (winProbLoss >= 5) return { type: "inaccuracy", winProbLoss };
  if (winProbLoss <= -5) return { type: "brilliant", winProbLoss };
  if (winProbLoss <= -1) return { type: "excellent", winProbLoss };
  return { type: "good", winProbLoss };
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

  let prevWinChance: number = startEval.winChance;
  const evaluatedMoves: EvaluatedMove[] = [];

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const wasWhiteTurn = i % 2 === 0;
    const evalData = allResults[i + 1]; // +1 because index 0 is starting position

    if (!evalData || evalData.error) {
      // Skip positions that failed to evaluate
      continue;
    }

    const currWinChance: number = evalData.winChance;

    // Convert to moving player's perspective for classification
    const playerWinBefore = wasWhiteTurn ? prevWinChance : 100 - prevWinChance;
    const playerWinAfter = wasWhiteTurn ? currWinChance : 100 - currWinChance;

    const classification = classifyMove(playerWinBefore, playerWinAfter);

    evaluatedMoves.push({
      fen: positions[i + 1].fen,
      moveNumber: Math.floor(i / 2) + 1,
      move: move.san,
      san: move.san,
      score: Math.round(evalData.eval * 100),
      winChance: currWinChance,
      bestMove: evalData.move || null,
      bestMoveSan: evalData.san || null,
      depth: evalData.depth,
      mate: evalData.mate,
      classification,
      color: wasWhiteTurn ? "w" : "b",
    });

    prevWinChance = currWinChance;
  }

  // ── Accuracy calculation ──
  const allWinChances = [startEval.winChance, ...evaluatedMoves.map((m) => m.winChance)];

  // CAPS2-style per-move accuracy with very steep penalties
  // Chess.com typically gives 800s ~40-65%, GMs ~85-95%
  // We use a steep sigmoid-based curve centered around small WP losses
  const moveAccuracy = (before: number, after: number, isWhite: boolean): number => {
    const winBefore = isWhite ? before : 100 - before;
    const winAfter = isWhite ? after : 100 - after;
    
    const winDiff = winBefore - winAfter;
    
    // Near-perfect moves: matched or very close to engine
    if (winDiff <= 0.3) return 100;
    if (winDiff <= 0.8) return 97;
    
    // Use a steep exponential that punishes even small inaccuracies hard
    // 1% → 90, 2% → 72, 3% → 55, 5% → 30, 8% → 10, 10% → 4, 15%+ → ~0
    const raw = 103.1668 * Math.exp(-0.17 * winDiff) - 3.1669;
    return Math.max(0, Math.min(100, raw));
  };

  const calcGameAccuracy = (color: "w" | "b") => {
    const isWhite = color === "w";
    const accs: number[] = [];

    for (let i = 0; i < evaluatedMoves.length; i++) {
      const moveColor = evaluatedMoves[i].color;
      if (moveColor !== color) continue;

      const wcIdx = i;
      accs.push(moveAccuracy(allWinChances[wcIdx], allWinChances[wcIdx + 1], isWhite));
    }

    if (accs.length === 0) return 100;
    
    // Harmonic mean: heavily penalizes bad moves (like chess.com CAPS2)
    // A single 0% accuracy move can drag the whole game down
    // Add small epsilon to avoid division by zero
    const epsilon = 0.5;
    const harmonicSum = accs.reduce((sum, a) => sum + 1 / (a + epsilon), 0);
    const harmonicMean = accs.length / harmonicSum - epsilon;
    
    return Math.round(Math.max(0, Math.min(100, harmonicMean)));
  };

  const accuracy = {
    white: calcGameAccuracy("w"),
    black: calcGameAccuracy("b"),
  };

  // Generate summary for AI
  const blunders = evaluatedMoves.filter((m) => m.classification.type === "blunder");
  const mistakes = evaluatedMoves.filter((m) => m.classification.type === "mistake");
  const inaccuracies = evaluatedMoves.filter((m) => m.classification.type === "inaccuracy");

  const summaryLines = [
    `Stockfish 17 NNUE analysis (chess-api.com):`,
    `White accuracy: ${accuracy.white}%, Black accuracy: ${accuracy.black}%`,
    `Blunders: ${blunders.length}, Mistakes: ${mistakes.length}, Inaccuracies: ${inaccuracies.length}`,
  ];

  if (blunders.length > 0) {
    summaryLines.push(
      "Critical blunders: " +
        blunders
          .map((b) => `${b.moveNumber}${b.color === "w" ? "." : "..."} ${b.san} (${Math.round(b.classification.winProbLoss)}% WP loss)`)
          .join(", ")
    );
  }

  if (mistakes.length > 0) {
    summaryLines.push(
      "Mistakes: " +
        mistakes
          .map((m) => `${m.moveNumber}${m.color === "w" ? "." : "..."} ${m.san} (${Math.round(m.classification.winProbLoss)}% WP loss)`)
          .join(", ")
    );
  }

  return { moves: evaluatedMoves, accuracy, summary: summaryLines.join("\n") };
}
