/**
 * Evaluates all positions in a PGN using chess.js + Stockfish engine.
 * Returns centipawn evaluations for each move.
 */

import { Chess } from "chess.js";
import { StockfishEngine, StockfishEval, classifyMove, cpToWinProb, MoveClassification } from "./stockfish-engine";

export interface EvaluatedMove extends StockfishEval {
  classification: MoveClassification;
  san: string;
  color: "w" | "b";
}

export interface GameEvaluation {
  moves: EvaluatedMove[];
  accuracy: { white: number; black: number };
  summary: string; // brief text summary of engine findings
}

export async function evaluateGame(
  pgn: string,
  onProgress?: (current: number, total: number) => void,
  depth: number = 14
): Promise<GameEvaluation> {
  const chess = new Chess();

  // Load PGN
  try {
    chess.loadPgn(pgn);
  } catch {
    throw new Error("Invalid PGN format");
  }

  const history = chess.history({ verbose: true });
  if (history.length === 0) throw new Error("No moves found in PGN");

  // Initialize engine
  const engine = new StockfishEngine();
  try {
    await engine.init();
  } catch {
    throw new Error("Failed to initialize Stockfish engine. Your browser may not support WebAssembly.");
  }

  const evaluatedMoves: EvaluatedMove[] = [];

  // Reset board to starting position
  const replayChess = new Chess();

  // Evaluate starting position first (white to move, so score is already from white's perspective)
  const startEval = await engine.evaluate(replayChess.fen(), depth);
  // Stockfish returns score from side-to-move's perspective.
  // Normalize all scores to white's perspective for consistent comparison.
  let prevScore = startEval.score; // starting pos is white's turn, so already white's perspective

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const wasWhiteTurn = replayChess.turn() === "w";

    replayChess.move(move.san);
    const fen = replayChess.fen();

    onProgress?.(i + 1, history.length);

    const evalResult = await engine.evaluate(fen, depth);

    // Stockfish scores are from side-to-move's perspective.
    // After white moves, it's black's turn, so negate to get white's perspective.
    // After black moves, it's white's turn, so score is already white's perspective.
    const normalizedScore = wasWhiteTurn ? -evalResult.score : evalResult.score;

    const classification = classifyMove(prevScore, normalizedScore, wasWhiteTurn);

    evaluatedMoves.push({
      fen,
      moveNumber: Math.floor(i / 2) + 1,
      move: move.san,
      san: move.san,
      score: normalizedScore,
      bestMove: evalResult.bestMove,
      depth: evalResult.depth,
      mate: evalResult.mate,
      classification,
      color: wasWhiteTurn ? "w" : "b",
    });

    prevScore = normalizedScore;
  }

  engine.destroy();

  // ── Lichess-exact game accuracy calculation ──
  // Source: https://github.com/lichess-org/lila/blob/master/modules/analyse/src/main/AccuracyPercent.scala
  //
  // 1. Compute per-move accuracy using Lichess formula (with +1 uncertainty bonus)
  // 2. Compute sliding window volatility weights (stddev of Win% in each window)
  // 3. Game accuracy = average of (volatility-weighted mean, harmonic mean)

  // Build full Win% sequence from white's perspective
  const allWinPercents = [cpToWinProb(startEval.score), ...evaluatedMoves.map((m) => cpToWinProb(m.score))];

  const windowSize = Math.max(2, Math.min(8, Math.floor(evaluatedMoves.length / 10)));

  // Build sliding windows (first few windows are padded with the initial window)
  const paddingCount = Math.min(windowSize - 2, allWinPercents.length - windowSize);
  const initialWindow = allWinPercents.slice(0, windowSize);
  const windows = [
    ...Array.from({ length: Math.max(0, paddingCount) }, () => initialWindow),
    ...Array.from({ length: Math.max(0, allWinPercents.length - windowSize + 1) }, (_, i) =>
      allWinPercents.slice(i, i + windowSize)
    ),
  ];

  const stddev = (arr: number[]) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length);
  };

  const weights = windows.map((w) => Math.max(0.5, Math.min(12, stddev(w))));

  // Per-move accuracy (Lichess formula with +1 uncertainty bonus)
  const moveAccuracyFromWinPercents = (before: number, after: number, isWhite: boolean) => {
    const winBefore = isWhite ? before : 100 - before;
    const winAfter = isWhite ? after : 100 - after;
    if (winAfter >= winBefore) return 100;
    const winDiff = winBefore - winAfter;
    const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * winDiff) + -3.166924740191411;
    return Math.max(0, Math.min(100, raw + 1)); // +1 uncertainty bonus
  };

  const calcGameAccuracy = (color: "w" | "b") => {
    const isWhite = color === "w";
    const moveAccuracies: { accuracy: number; weight: number }[] = [];

    for (let i = 0; i < evaluatedMoves.length; i++) {
      const moveColor = i % 2 === 0 ? "w" : "b"; // alternating from start
      if (moveColor !== color) continue;

      const prevWP = allWinPercents[i];
      const currWP = allWinPercents[i + 1];
      const acc = moveAccuracyFromWinPercents(prevWP, currWP, isWhite);
      const w = weights[i] ?? 1;
      moveAccuracies.push({ accuracy: acc, weight: w });
    }

    if (moveAccuracies.length === 0) return 100;

    // Volatility-weighted mean
    const totalWeight = moveAccuracies.reduce((s, m) => s + m.weight, 0);
    const weightedMean = totalWeight > 0
      ? moveAccuracies.reduce((s, m) => s + m.accuracy * m.weight, 0) / totalWeight
      : 0;

    // Harmonic mean (skip zeros to avoid division by zero)
    const nonZero = moveAccuracies.filter((m) => m.accuracy > 0);
    const harmonicMean = nonZero.length > 0
      ? nonZero.length / nonZero.reduce((s, m) => s + 1 / m.accuracy, 0)
      : 0;

    return Math.round((weightedMean + harmonicMean) / 2);
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
    `Engine analysis at depth ${depth}:`,
    `White accuracy: ${accuracy.white}%, Black accuracy: ${accuracy.black}%`,
    `Blunders: ${blunders.length}, Mistakes: ${mistakes.length}, Inaccuracies: ${inaccuracies.length}`,
  ];

  if (blunders.length > 0) {
    summaryLines.push(
      "Critical blunders: " +
        blunders
          .map((b) => `${b.moveNumber}${b.color === "w" ? "." : "..."} ${b.san} (${b.classification.cpLoss}cp loss)`)
          .join(", ")
    );
  }

  if (mistakes.length > 0) {
    summaryLines.push(
      "Mistakes: " +
        mistakes
          .map((m) => `${m.moveNumber}${m.color === "w" ? "." : "..."} ${m.san} (${m.classification.cpLoss}cp loss)`)
          .join(", ")
    );
  }

  return {
    moves: evaluatedMoves,
    accuracy,
    summary: summaryLines.join("\n"),
  };
}
