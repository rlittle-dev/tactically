import { RecentGame } from "@/lib/chess-api";
import { motion } from "framer-motion";
import { BookOpen, ExternalLink } from "lucide-react";

interface Props {
  games: RecentGame[];
  username: string;
}

interface OpeningData {
  name: string;
  slug: string;
  count: number;
  wins: number;
  losses: number;
  draws: number;
}

function extractOpening(pgn: string): { name: string; slug: string } | null {
  const match = pgn.match(/\[ECOUrl "https:\/\/www\.chess\.com\/openings\/([^"]+)"\]/);
  if (match) {
    const slug = match[1];
    const name = slug.replace(/-/g, " ").replace(/\.\.\./g, "…");
    return { name, slug };
  }
  const nameMatch = pgn.match(/\[Opening "([^"]+)"\]/);
  if (nameMatch) {
    const name = nameMatch[1];
    const slug = name.replace(/\s+/g, "-").toLowerCase();
    return { name, slug };
  }
  return null;
}

function getResultFromPgn(game: RecentGame, username: string): "win" | "loss" | "draw" {
  const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
  const result = isWhite ? game.white.result : game.black.result;
  if (result === "win") return "win";
  if (["checkmated", "timeout", "resigned", "abandoned"].includes(result)) return "loss";
  return "draw";
}

function getLichessStudyUrl(slug: string): string {
  const simplified = slug.split("-").slice(0, 3).join("-").toLowerCase();
  return `https://lichess.org/opening/${simplified}`;
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
    const opening = extractOpening(game.pgn);
    if (!opening) continue;

    const existing = openingMap.get(opening.name) || { name: opening.name, slug: opening.slug, count: 0, wins: 0, losses: 0, draws: 0 };
    existing.count++;
    const result = getResultFromPgn(game, username);
    if (result === "win") existing.wins++;
    else if (result === "loss") existing.losses++;
    else existing.draws++;
    openingMap.set(opening.name, existing);
  }

  const openings = Array.from(openingMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  if (openings.length === 0) return null;

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
      <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
        {openings.map((o) => {
          const winPct = o.count > 0 ? Math.round((o.wins / o.count) * 100) : 0;
          const lossPct = o.count > 0 ? Math.round((o.losses / o.count) * 100) : 0;
          const drawPct = 100 - winPct - lossPct;

          return (
            <motion.div key={o.name} variants={item} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground truncate font-display italic">{o.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {o.count} game{o.count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-success">{winPct}%</span>
                </div>
              </div>
              <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden flex">
                <motion.div
                  className="h-full bg-success/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${winPct}%` }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
                {drawPct > 0 && (
                  <motion.div
                    className="h-full bg-muted-foreground/30"
                    initial={{ width: 0 }}
                    animate={{ width: `${drawPct}%` }}
                    transition={{ duration: 0.6, delay: 0.35 }}
                  />
                )}
                <motion.div
                  className="h-full bg-destructive/50"
                  initial={{ width: 0 }}
                  animate={{ width: `${lossPct}%` }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                />
              </div>
              <a
                href={getLichessStudyUrl(o.slug)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Study on Lichess <ExternalLink className="h-3 w-3" />
              </a>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};

export default TopOpenings;
