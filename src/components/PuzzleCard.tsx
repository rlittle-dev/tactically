import { ChessStats } from "@/lib/chess-api";
import { Lightbulb, Flame, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  stats: ChessStats;
}

const PuzzleCard = ({ stats }: Props) => {
  const highestRating = stats.tactics?.highest?.rating;
  const lowestRating = stats.tactics?.lowest?.rating;
  const rushBest = stats.puzzle_rush?.best?.score;
  const rushAttempts = stats.puzzle_rush?.best?.total_attempts;

  if (!highestRating && !rushBest) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5 cursor-default"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-foreground/5 text-foreground/60">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Puzzles</h3>
          {highestRating && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.5 }}
              className="text-3xl font-display italic font-light text-foreground"
            >
              {highestRating}
            </motion.p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {highestRating && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-success" /> Peak
            </span>
            <span className="text-success">{highestRating}</span>
          </div>
        )}
        {lowestRating && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" /> Lowest
            </span>
            <span className="text-destructive">{lowestRating}</span>
          </div>
        )}
        {rushBest != null && (
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5" /> Puzzle Rush
            </span>
            <span className="font-display italic text-foreground">
              {rushBest}{rushAttempts ? <span className="text-muted-foreground text-xs">/{rushAttempts}</span> : ""}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PuzzleCard;
