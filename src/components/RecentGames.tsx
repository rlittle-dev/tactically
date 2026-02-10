import { RecentGame, getResult, getOpponentName, getOpponentRating, getPlayerRating } from "@/lib/chess-api";
import { Clock, Zap, Gauge, Trophy, X, Minus } from "lucide-react";
import { motion } from "framer-motion";

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
  draw: { icon: <Minus className="h-4 w-4" />, color: "text-muted-foreground", bg: "bg-muted", label: "D" },
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.3 } },
};

const item = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const RecentGames = ({ games, username }: Props) => {
  if (!games.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5"
    >
      <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">Recent Matches</h3>
      <motion.div className="space-y-1" variants={container} initial="hidden" animate="show">
        {games.map((game, i) => {
          const result = getResult(game, username);
          const cfg = resultConfig[result];
          const opponent = getOpponentName(game, username);
          const oppRating = getOpponentRating(game, username);
          const myRating = getPlayerRating(game, username);
          const date = new Date(game.end_time * 1000);

          return (
            <motion.a
              key={i}
              variants={item}
              whileHover={{ x: 4, backgroundColor: "hsl(0 0% 11% / 0.8)" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              href={game.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
            >
              <div className={`p-1.5 rounded ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground truncate">{opponent}</span>
                  <span className="text-xs text-muted-foreground">({oppRating})</span>
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
              <span className="text-sm font-display italic text-foreground">{myRating}</span>
            </motion.a>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default RecentGames;
