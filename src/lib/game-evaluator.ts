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

  // ── Game accuracy calculation (chess.com CAPS-style) ──
  // Per-move accuracy = how much of the player's winning chances they retained.
  // moveAccuracy = min(100, winAfter / winBefore * 100)
  // Game accuracy = simple average of all per-move accuracies for that color.

  const allWinPercents = [cpToWinProb(startEval.score), ...evaluatedMoves.map((m) => cpToWinProb(m.score))];

  const calcGameAccuracy = (color: "w" | "b") => {
    const isWhite = color === "w";
    const moveAccuracies: number[] = [];

    for (let i = 0; i < evaluatedMoves.length; i++) {
      const moveColor = i % 2 === 0 ? "w" : "b";
      if (moveColor !== color) continue;

      const prevWP = allWinPercents[i];
      const currWP = allWinPercents[i + 1];

      // Convert to moving player's perspective
      const winBefore = isWhite ? prevWP : 100 - prevWP;
      const winAfter = isWhite ? currWP : 100 - currWP;

      // If player improved or maintained, 100% accuracy for this move
      if (winAfter >= winBefore) {
        moveAccuracies.push(100);
        continue;
      }

      // Retention: what fraction of winning chances did they keep?
      // Guard against division by near-zero (already lost position)
      if (winBefore < 1) {
        moveAccuracies.push(100); // can't lose what you don't have
        continue;
      }

      const retention = (winAfter / winBefore) * 100;
      moveAccuracies.push(Math.max(0, Math.min(100, retention)));
    }

    if (moveAccuracies.length === 0) return 100;
    return Math.round(moveAccuracies.reduce((a, b) => a + b, 0) / moveAccuracies.length);
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
