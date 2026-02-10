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
        <div className="p-2 rounded-sm bg-foreground/5 text-foreground/60">{icon}</div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</h3>
          <p className="text-3xl font-display italic font-light text-foreground">{last.rating}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Best
          </span>
          <span className="font-display italic text-foreground">{best.rating}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-success" /> Wins
          </span>
          <span className="text-success">{record.win.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-destructive" /> Losses
          </span>
          <span className="text-destructive">{record.loss.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Draws</span>
          <span className="text-muted-foreground">{record.draw.toLocaleString()}</span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground text-xs uppercase tracking-wider">Win Rate</span>
            <span className="font-display italic text-lg text-foreground">{winRate}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
            <div className="h-full bg-success" style={{ width: `${(record.win / total) * 100}%` }} />
            <div className="h-full bg-muted-foreground/30" style={{ width: `${(record.draw / total) * 100}%` }} />
            <div className="h-full bg-destructive" style={{ width: `${(record.loss / total) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RatingCard;
