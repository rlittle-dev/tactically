/**
 * Evaluates all positions in a PGN using chess-api.com (Stockfish 17 NNUE).
 * Returns evaluations, classifications, and accuracy for each move.
 */

import { Chess } from "chess.js";

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

interface ChessApiResponse {
  eval: number;
  winChance: number;
  move: string;
  san: string;
  depth: number;
  mate: number | null;
  type: string;
  text: string;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function evalPosition(fen: string, depth: number = 16, retries = 2): Promise<ChessApiResponse> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch("https://chess-api.com/v1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, depth, maxThinkingTime: 100 }),
    });
    if (!res.ok) throw new Error(`chess-api HTTP error: ${res.status}`);
    const data = await res.json();
    if (data.type === "error") {
      if (data.error === "HIGH_USAGE" && attempt < retries) {
        await delay(2000 * (attempt + 1)); // back off and retry
        continue;
      }
      throw new Error(data.text || data.error || "chess-api error");
    }
    return data;
  }
  throw new Error("chess-api: max retries exceeded");
}

/**
 * Classify a move based on Win% loss from the moving player's perspective.
 * Thresholds calibrated to match chess.com-style sensitivity.
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

  const evaluatedMoves: EvaluatedMove[] = [];
  const replayChess = new Chess();

  // Evaluate starting position
  const startData = await evalPosition(replayChess.fen());
  // chess-api.com winChance: >50 = white winning, <50 = black winning
  let prevWinChance = startData.winChance;

  for (let i = 0; i < history.length; i++) {
    const move = history[i];
    const wasWhiteTurn = replayChess.turn() === "w";

    replayChess.move(move.san);
    const fen = replayChess.fen();

    onProgress?.(i + 1, history.length);

    // Small delay to respect chess-api.com rate limits
    if (i > 0) await delay(200);
    const evalData = await evalPosition(fen);

    // winChance from chess-api is always from white's perspective (>50 = white winning)
    const currWinChance = evalData.winChance;

    // Convert to moving player's perspective for classification
    const playerWinBefore = wasWhiteTurn ? prevWinChance : 100 - prevWinChance;
    const playerWinAfter = wasWhiteTurn ? currWinChance : 100 - currWinChance;

    const classification = classifyMove(playerWinBefore, playerWinAfter);

    evaluatedMoves.push({
      fen,
      moveNumber: Math.floor(i / 2) + 1,
      move: move.san,
      san: move.san,
      score: Math.round(evalData.eval * 100), // convert pawns to centipawns
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
  // Uses chess.com's CAPS formula: exponential decay based on Win% loss
  const allWinChances = [startData.winChance, ...evaluatedMoves.map((m) => m.winChance)];

  const moveAccuracy = (before: number, after: number, isWhite: boolean): number => {
    const winBefore = isWhite ? before : 100 - before;
    const winAfter = isWhite ? after : 100 - after;
    if (winAfter >= winBefore) return 100;
    const winDiff = winBefore - winAfter;
    const raw = 103.1668 * Math.exp(-0.04354 * winDiff) - 3.1669;
    return Math.max(0, Math.min(100, raw));
  };

  const calcGameAccuracy = (color: "w" | "b") => {
    const isWhite = color === "w";
    const accs: number[] = [];

    for (let i = 0; i < evaluatedMoves.length; i++) {
      const moveColor = i % 2 === 0 ? "w" : "b";
      if (moveColor !== color) continue;
      accs.push(moveAccuracy(allWinChances[i], allWinChances[i + 1], isWhite));
    }

    if (accs.length === 0) return 100;
    return Math.round(accs.reduce((a, b) => a + b, 0) / accs.length);
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
