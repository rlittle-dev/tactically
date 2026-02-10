import { ChessStats } from "@/lib/chess-api";
import { Lightbulb, Flame, TrendingUp, TrendingDown } from "lucide-react";

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
    <div
      className="bg-card border border-border rounded-lg p-5 card-hover opacity-0 animate-fade-in"
      style={{ animationDelay: "300ms" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-sm bg-foreground/5 text-foreground">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xs font-display italic text-muted-foreground tracking-wide">Puzzles</h3>
          {highestRating && (
            <p className="text-2xl font-bold text-foreground font-mono">{highestRating}</p>
          )}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {highestRating && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-success" /> Peak
            </span>
            <span className="font-mono text-success">{highestRating}</span>
          </div>
        )}
        {lowestRating && (
          <div className="flex justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" /> Lowest
            </span>
            <span className="font-mono text-destructive">{lowestRating}</span>
          </div>
        )}
        {rushBest != null && (
          <div className="flex justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-foreground" /> Puzzle Rush
            </span>
            <span className="font-mono text-foreground">
              {rushBest}{rushAttempts ? `/${rushAttempts}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PuzzleCard;
