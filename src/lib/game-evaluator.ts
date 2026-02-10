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

  // Calculate accuracy using chess.com-style win probability method
  // For each move, accuracy = how much win probability you preserved vs the best move
  const calcAccuracy = (color: "w" | "b") => {
    const playerMoves = evaluatedMoves.filter((m) => m.color === color);
    if (playerMoves.length === 0) return 100;

    let totalAccuracy = 0;
    for (const move of playerMoves) {
      // Win prob loss is already calculated; convert to per-move accuracy
      // Chess.com formula: accuracy ≈ 103.1668 * exp(-0.04354 * winProbLoss) - 3.1669
      // Simplified: if winProbLoss <= 0 (good move), accuracy = 100
      const wpl = Math.max(0, move.classification.winProbLoss);
      const moveAccuracy = Math.min(100, Math.max(0, 103.1668 * Math.exp(-0.04354 * wpl) - 3.1669));
      totalAccuracy += moveAccuracy;
    }
    return Math.round(totalAccuracy / playerMoves.length);
  };

  const accuracy = {
    white: calcAccuracy("w"),
    black: calcAccuracy("b"),
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
