import { ChessStats } from "@/lib/chess-api";
import { Lightbulb, Flame } from "lucide-react";

interface Props {
  stats: ChessStats;
}

const PuzzleCard = ({ stats }: Props) => {
  const puzzleRating = stats.tactics?.highest?.rating;
  const rushBest = stats.puzzle_rush?.best?.score;

  if (!puzzleRating && !rushBest) return null;

  return (
    <div
      className="bg-card border border-border rounded-lg p-5 card-hover opacity-0 animate-fade-in"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-md bg-primary/10 text-primary">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Puzzles</h3>
          {puzzleRating && (
            <p className="text-2xl font-bold text-foreground font-mono">{puzzleRating}</p>
          )}
        </div>
      </div>

      {rushBest && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground flex items-center gap-1">
            <Flame className="h-3.5 w-3.5 text-primary" /> Puzzle Rush Best
          </span>
          <span className="font-mono text-primary">{rushBest}</span>
        </div>
      )}
    </div>
  );
};

export default PuzzleCard;
