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
        <div className="p-2 rounded-sm bg-foreground/5 text-foreground/60">
          <Lightbulb className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Puzzles</h3>
          {highestRating && (
            <p className="text-3xl font-display italic font-light text-foreground">{highestRating}</p>
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
    </div>
  );
};

export default PuzzleCard;
