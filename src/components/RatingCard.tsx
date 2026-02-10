import { TimeControlStats } from "@/lib/chess-api";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";

interface Props {
  label: string;
  icon: React.ReactNode;
  stats?: TimeControlStats;
  delay?: number;
}

const RatingCard = ({ label, icon, stats, delay = 0 }: Props) => {
  if (!stats) return null;

  const { last, best, record } = stats;
  const total = record.win + record.loss + record.draw;
  const winRate = total > 0 ? ((record.win / total) * 100).toFixed(1) : "0";

  return (
    <div
      className="bg-card border border-border rounded-lg p-5 card-hover opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-md bg-primary/10 text-primary">{icon}</div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
          <p className="text-2xl font-bold text-foreground font-mono">{last.rating}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Trophy className="h-3.5 w-3.5" /> Best
          </span>
          <span className="font-mono text-primary">{best.rating}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-success" /> Wins
          </span>
          <span className="font-mono text-success">{record.win}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" /> Losses
          </span>
          <span className="font-mono text-destructive">{record.loss}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Draws</span>
          <span className="font-mono text-chart-draw">{record.draw}</span>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-mono font-semibold text-foreground">{winRate}%</span>
          </div>
          {/* Win/Loss bar */}
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden flex">
            <div
              className="h-full bg-success rounded-l-full"
              style={{ width: `${(record.win / total) * 100}%` }}
            />
            <div
              className="h-full bg-chart-draw"
              style={{ width: `${(record.draw / total) * 100}%` }}
            />
            <div
              className="h-full bg-destructive rounded-r-full"
              style={{ width: `${(record.loss / total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingCard;
