/**
 * Stockfish WASM Web Worker wrapper.
 * Communicates with the engine via UCI protocol.
 */

export interface StockfishEval {
  fen: string;
  moveNumber: number;
  move: string; // SAN notation
  score: number; // centipawns from white's perspective
  bestMove: string | null;
  depth: number;
  mate: number | null; // mate in N (positive = white wins, negative = black wins)
}

export interface MoveClassification {
  type: "blunder" | "mistake" | "inaccuracy" | "good" | "excellent" | "book";
  cpLoss: number;
}

export function classifyMove(prevScore: number, currentScore: number, isWhiteTurn: boolean): MoveClassification {
  // cpLoss from the moving side's perspective
  const delta = isWhiteTurn
    ? prevScore - currentScore  // white just moved, score should stay same or improve
    : currentScore - prevScore; // black just moved, negative score improving means delta positive

  if (delta >= 200) return { type: "blunder", cpLoss: delta };
  if (delta >= 100) return { type: "mistake", cpLoss: delta };
  if (delta >= 50) return { type: "inaccuracy", cpLoss: delta };
  if (delta <= -50) return { type: "excellent", cpLoss: delta };
  return { type: "good", cpLoss: delta };
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready = false;
  private messageResolvers: ((value: string) => void)[] = [];

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.worker = new Worker("/stockfish/stockfish.js");

        this.worker.onmessage = (e: MessageEvent) => {
          const msg = typeof e.data === "string" ? e.data : "";
          // Resolve any waiting promises
          if (this.messageResolvers.length > 0) {
            // Check if this is a final response
            if (msg.startsWith("bestmove") || msg === "uciok" || msg === "readyok") {
              const resolver = this.messageResolvers.shift();
              resolver?.(msg);
            }
          }
        };

        this.worker.onerror = (err) => {
          reject(new Error(`Stockfish worker error: ${err.message}`));
        };

        // Initialize UCI
        this.send("uci");
        this.waitFor("uciok").then(() => {
          this.send("isready");
          return this.waitFor("readyok");
        }).then(() => {
          this.ready = true;
          // Configure for analysis (lower hash for browser)
          this.send("setoption name Hash value 16");
          resolve();
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  private send(command: string) {
    this.worker?.postMessage(command);
  }

  private waitFor(expected: string): Promise<string> {
    return new Promise((resolve) => {
      const handler = (e: MessageEvent) => {
        const msg = typeof e.data === "string" ? e.data : "";
        if (msg.startsWith(expected)) {
          this.worker?.removeEventListener("message", handler);
          resolve(msg);
        }
      };
      this.worker?.addEventListener("message", handler);
    });
  }

  async evaluate(fen: string, depth: number = 16): Promise<{ score: number; bestMove: string | null; mate: number | null; depth: number }> {
    if (!this.ready || !this.worker) throw new Error("Engine not ready");

    return new Promise((resolve) => {
      let lastInfo = { score: 0, bestMove: null as string | null, mate: null as number | null, depth: 0 };

      const handler = (e: MessageEvent) => {
        const msg = typeof e.data === "string" ? e.data : "";

        // Parse info lines for score
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
  }
}
