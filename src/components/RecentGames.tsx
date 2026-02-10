import { RecentGame, getResult, getOpponentName, getOpponentRating, getPlayerRating } from "@/lib/chess-api";
import { Clock, Zap, Gauge, Trophy, X, Minus } from "lucide-react";

interface Props {
  games: RecentGame[];
  username: string;
}

const timeClassIcon: Record<string, React.ReactNode> = {
  rapid: <Clock className="h-3.5 w-3.5" />,
  blitz: <Zap className="h-3.5 w-3.5" />,
  bullet: <Gauge className="h-3.5 w-3.5" />,
};

const resultConfig = {
  win: { icon: <Trophy className="h-4 w-4" />, color: "text-success", bg: "bg-success/10", label: "W" },
  loss: { icon: <X className="h-4 w-4" />, color: "text-destructive", bg: "bg-destructive/10", label: "L" },
  draw: { icon: <Minus className="h-4 w-4" />, color: "text-chart-draw", bg: "bg-muted", label: "D" },
};

const RecentGames = ({ games, username }: Props) => {
  if (!games.length) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-5 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Matches</h3>
      <div className="space-y-2">
        {games.map((game, i) => {
          const result = getResult(game, username);
          const cfg = resultConfig[result];
          const opponent = getOpponentName(game, username);
          const oppRating = getOpponentRating(game, username);
          const myRating = getPlayerRating(game, username);
          const date = new Date(game.end_time * 1000);

          return (
            <a
              key={i}
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-secondary/80 transition-colors group"
            >
              <div className={`p-1.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground truncate">{opponent}</span>
                  <span className="text-xs font-mono text-muted-foreground">({oppRating})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    {timeClassIcon[game.time_class] || timeClassIcon.rapid}
                    {game.time_class}
                  </span>
                  <span>·</span>
                  <span>{date.toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono text-foreground">{myRating}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default RecentGames;
