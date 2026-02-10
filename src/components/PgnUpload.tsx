import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X } from "lucide-react";
import { Chess } from "chess.js";
import { toast } from "sonner";
import GameAnalysisModal from "./GameAnalysisModal";

function isValidPgnOrFen(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  // Try as FEN
  try {
    const chess = new Chess();
    chess.load(trimmed);
    return true;
  } catch {}

  // Try as PGN
  try {
    const chess = new Chess();
    chess.loadPgn(trimmed);
    // Must have at least 1 move loaded
    return chess.history().length > 0;
  } catch {}

  return false;
}

const PgnUpload = () => {
  const [pgn, setPgn] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) setPgn(text.trim());
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleAnalyze = () => {
    if (!pgn.trim()) return;
    if (!isValidPgnOrFen(pgn)) {
      toast.error("Invalid input — please paste a valid PGN or FEN string");
      return;
    }
    setAnalyzing(true);
  };

  return (
    <>
      <div className="bg-card/60 backdrop-blur-xl border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Analyze a Game</h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/60 hover:border-foreground/30"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload .pgn
          </motion.button>
          <input
            ref={fileRef}
            type="file"
            accept=".pgn,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        <div className="relative">
          <textarea
            value={pgn}
            onChange={(e) => setPgn(e.target.value)}
            placeholder="Paste PGN or FEN here...&#10;&#10;Example:&#10;1. e4 e5 2. Nf3 Nc6 3. Bb5 a6..."
            className="w-full h-32 bg-background/50 border border-border rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-foreground/30 transition-colors"
          />
          {pgn && (
            <button
              onClick={() => setPgn("")}
              className="absolute top-2 right-2 p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAnalyze}
          disabled={!pgn.trim()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
        >
          <FileText className="h-4 w-4" />
          Analyze Game
        </motion.button>
      </div>

      {analyzing && (
        <GameAnalysisModal
          rawPgn={pgn}
          onClose={() => setAnalyzing(false)}
        />
      )}
    </>
  );
};

export default PgnUpload;
