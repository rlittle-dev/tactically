import { TimeControlStats } from "@/lib/chess-api";
import { TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  label: string;
  icon: React.ReactNode;
  stats?: TimeControlStats;
  delay?: number;
}

const RatingCard = ({ label, icon, stats, delay = 0 }: Props) => {
  if (!stats?.last?.rating && !stats?.best?.rating) return null;

  const last = stats.last ?? { rating: 0 };
  const best = stats.best ?? { rating: 0 };
  const record = stats.record ?? { win: 0, loss: 0, draw: 0 };
  const total = record.win + record.loss + record.draw;
  const winRate = total > 0 ? ((record.win / total) * 100).toFixed(1) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.6,
        delay: delay / 1000,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        transition: { type: "spring", stiffness: 400, damping: 25 },
      }}
      className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5 cursor-default"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-foreground/5 text-foreground/60">{icon}</div>
        <div>
          <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">{label}</h3>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: delay / 1000 + 0.2 }}
            className="text-3xl font-display italic font-light text-foreground"
          >
            {last.rating}
          </motion.p>
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
            <motion.div
              className="h-full bg-success"
              initial={{ width: 0 }}
              animate={{ width: `${(record.win / total) * 100}%` }}
              transition={{ duration: 1, delay: delay / 1000 + 0.4, ease: "easeOut" }}
            />
            <div className="h-full bg-muted-foreground/30" style={{ width: `${(record.draw / total) * 100}%` }} />
            <motion.div
              className="h-full bg-destructive"
              initial={{ width: 0 }}
              animate={{ width: `${(record.loss / total) * 100}%` }}
              transition={{ duration: 1, delay: delay / 1000 + 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RatingCard;
