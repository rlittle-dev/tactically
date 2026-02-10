/**
 * Stockfish Web Worker wrapper using inline worker approach.
 * Falls back gracefully if WebAssembly/Workers unavailable.
 */

export interface StockfishEval {
  fen: string;
  moveNumber: number;
  move: string;
  score: number; // centipawns from white's perspective
  bestMove: string | null;
  depth: number;
  mate: number | null;
}

export interface MoveClassification {
  type: "blunder" | "mistake" | "inaccuracy" | "good" | "excellent" | "brilliant" | "book";
  cpLoss: number;
  winProbLoss: number; // win probability percentage points lost
}

/**
 * Convert centipawn score to win probability (0-100) using chess.com-style sigmoid.
 * Score should be from white's perspective.
 */
export function cpToWinProb(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/**
 * Classify a move based on eval drop in pawns (chess.com style).
 * All eval drops are measured from the moving player's perspective.
 * A drop from +6 to +4 IS a miss (you had a big advantage and let it slip).
 * Not capitalizing on a blunder IS flagged.
 */
export function classifyMove(prevScore: number, currentScore: number, isWhiteTurn: boolean): MoveClassification {
  const prevWinProb = cpToWinProb(prevScore);
  const currWinProb = cpToWinProb(currentScore);

  const winProbLoss = isWhiteTurn
    ? prevWinProb - currWinProb
    : (100 - prevWinProb) - (100 - currWinProb);

  // Eval from the moving player's perspective (in pawns)
  const evalBefore = (isWhiteTurn ? prevScore : -prevScore) / 100;
  const evalAfter = (isWhiteTurn ? currentScore : -currentScore) / 100;
  const evalDrop = evalBefore - evalAfter; // positive = player lost eval

  const cpLossAbs = Math.max(0, Math.round(evalDrop * 100));

  // Blunder: ≥2 pawn eval drop
  if (evalDrop >= 2) return { type: "blunder", cpLoss: cpLossAbs, winProbLoss };
  // Mistake: ≥1 pawn eval drop
  if (evalDrop >= 1) return { type: "mistake", cpLoss: cpLossAbs, winProbLoss };
  // Inaccuracy: ≥0.5 pawn eval drop
  if (evalDrop >= 0.5) return { type: "inaccuracy", cpLoss: cpLossAbs, winProbLoss };
  // Brilliant / excellent based on win prob gain
  if (winProbLoss <= -5) return { type: "brilliant", cpLoss: Math.round(evalDrop * 100), winProbLoss };
  if (winProbLoss <= -1) return { type: "excellent", cpLoss: Math.round(evalDrop * 100), winProbLoss };
  return { type: "good", cpLoss: cpLossAbs, winProbLoss };
}

const STOCKFISH_PATH = "/stockfish/stockfish-asm.js";

async function createWorkerFromUrl(url: string): Promise<Worker> {
  // Fetch the script and create a blob worker to avoid CORS/CSP issues
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch stockfish: ${response.status}`);
  const scriptText = await response.text();
  const blob = new Blob([scriptText], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);
  const worker = new Worker(blobUrl);
  return worker;
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready = false;
  private blobUrl: string | null = null;

  async init(): Promise<void> {
    if (typeof Worker === "undefined") {
      throw new Error("Web Workers not supported");
    }

    // Try direct Worker first, then blob URL fallback
    try {
      this.worker = new Worker(STOCKFISH_PATH);
      await this.waitForReady();
      return;
    } catch {
      console.log("Direct worker failed, trying blob URL approach...");
      this.worker?.terminate();
    }

    try {
      this.worker = await createWorkerFromUrl(STOCKFISH_PATH);
      await this.waitForReady();
    } catch (err) {
      console.error("All Stockfish init approaches failed:", err);
      this.worker?.terminate();
      this.worker = null;
      throw err instanceof Error ? err : new Error(String(err));
    }
  }

  private async waitForReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.worker) return reject(new Error("No worker"));

      const timeout = setTimeout(() => {
        reject(new Error("Stockfish init timed out after 20s"));
      }, 20000);

      this.worker.onerror = (err) => {
        clearTimeout(timeout);
        reject(new Error(`Worker error: ${err.message || "unknown"}`));
      };

      const handler = (e: MessageEvent) => {
        const msg = typeof e.data === "string" ? e.data : "";
        if (msg === "uciok") {
          this.send("isready");
        } else if (msg === "readyok") {
          clearTimeout(timeout);
          this.ready = true;
          this.send("setoption name Hash value 16");
          this.worker?.removeEventListener("message", handler);
          resolve();
        }
      };

      this.worker.addEventListener("message", handler);
      this.send("uci");
    });
  }

  private send(command: string) {
    this.worker?.postMessage(command);
  }

  async evaluate(fen: string, depth: number = 10): Promise<{ score: number; bestMove: string | null; mate: number | null; depth: number }> {
    if (!this.ready || !this.worker) throw new Error("Engine not ready");

    return new Promise((resolve) => {
      let lastInfo = { score: 0, bestMove: null as string | null, mate: null as number | null, depth: 0 };

      const handler = (e: MessageEvent) => {
        const msg = typeof e.data === "string" ? e.data : "";

        if (msg.startsWith("info") && msg.includes("score")) {
          const depthMatch = msg.match(/depth (\d+)/);
          const cpMatch = msg.match(/score cp (-?\d+)/);
          const mateMatch = msg.match(/score mate (-?\d+)/);

          if (depthMatch) lastInfo.depth = parseInt(depthMatch[1]);

          if (cpMatch) {
            lastInfo.score = parseInt(cpMatch[1]);
            lastInfo.mate = null;
          } else if (mateMatch) {
            const mateIn = parseInt(mateMatch[1]);
            lastInfo.mate = mateIn;
            lastInfo.score = mateIn > 0 ? 10000 : -10000;
          }
        }

        if (msg.startsWith("bestmove")) {
          const bmMatch = msg.match(/bestmove (\S+)/);
          lastInfo.bestMove = bmMatch ? bmMatch[1] : null;
          this.worker?.removeEventListener("message", handler);
          resolve(lastInfo);
        }
      };

      this.worker!.addEventListener("message", handler);
      this.send("position fen " + fen);
      this.send(`go depth ${depth}`);
    });
  }

  destroy() {
    if (this.worker) {
      this.send("quit");
      this.worker.terminate();
      this.worker = null;
      this.ready = false;
    }
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
