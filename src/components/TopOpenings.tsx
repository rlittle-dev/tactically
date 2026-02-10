import { RecentGame } from "@/lib/chess-api";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

interface Props {
  games: RecentGame[];
  username: string;
}

interface OpeningData {
  name: string;
  count: number;
  wins: number;
  losses: number;
  draws: number;
}

function extractOpening(pgn: string): string | null {
  const match = pgn.match(/\[ECOUrl "https:\/\/www\.chess\.com\/openings\/([^"]+)"\]/);
  if (match) return match[1].replace(/-/g, " ").replace(/\.\.\./g, "…");
  const nameMatch = pgn.match(/\[Opening "([^"]+)"\]/);
  if (nameMatch) return nameMatch[1];
  return null;
}

function getResultFromPgn(game: RecentGame, username: string): "win" | "loss" | "draw" {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  const result = isWhite ? game.white.result : game.black.result;
  if (result === "win") return "win";
  if (["checkmated", "timeout", "resigned", "abandoned"].includes(result)) return "loss";
  return "draw";
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
};

const TopOpenings = ({ games, username }: Props) => {
  const openingMap = new Map<string, OpeningData>();

  for (const game of games) {
    if (!game.pgn) continue;
    const name = extractOpening(game.pgn);
    if (!name) continue;

    const existing = openingMap.get(name) || { name, count: 0, wins: 0, losses: 0, draws: 0 };
    existing.count++;
    const result = getResultFromPgn(game, username);
    if (result === "win") existing.wins++;
    else if (result === "loss") existing.losses++;
    else existing.draws++;
    openingMap.set(name, existing);
  }

  const openings = Array.from(openingMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (openings.length === 0) return null;

  const maxCount = openings[0].count;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, delay: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5"
    >
      <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4 flex items-center gap-2">
        <BookOpen className="h-3.5 w-3.5" /> Top Openings
      </h3>
      <motion.div className="space-y-2" variants={container} initial="hidden" animate="show">
        {openings.map((o) => {
          const winRate = o.count > 0 ? Math.round((o.wins / o.count) * 100) : 0;
          return (
            <motion.div key={o.name} variants={item} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground truncate font-display italic">{o.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {o.count} game{o.count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-success">{o.wins}W</span>
                  <span className="text-xs text-destructive">{o.losses}L</span>
                  {o.draws > 0 && <span className="text-xs text-muted-foreground">{o.draws}D</span>}
                </div>
              </div>
              <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden flex">
                <motion.div
                  className="h-full bg-foreground/50 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(o.count / maxCount) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default TopOpenings;
