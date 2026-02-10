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

// Known system keywords that should become the display name when found
const SYSTEM_KEYWORDS: [string, string][] = [
  // [search term (lowercase), display name matching Lichess URL]
  ["london system", "London System"],
  ["catalan", "Catalan Opening"],
  ["kings indian", "King's Indian Defense"],
  ["queens gambit", "Queen's Gambit"],
  ["sicilian", "Sicilian Defense"],
  ["french defense", "French Defense"],
  ["caro kann", "Caro-Kann Defense"],
  ["pirc defense", "Pirc Defense"],
  ["italian game", "Italian Game"],
  ["ruy lopez", "Ruy Lopez"],
  ["scotch game", "Scotch Game"],
  ["english opening", "English Opening"],
  ["dutch defense", "Dutch Defense"],
  ["grunfeld", "Gruenfeld Defense"],
  ["nimzo indian", "Nimzo-Indian Defense"],
  ["bogo indian", "Bogo-Indian Defense"],
  ["benoni", "Benoni Defense"],
  ["scandinavian", "Scandinavian Defense"],
  ["alekhine", "Alekhine Defense"],
  ["philidor", "Philidor Defense"],
  ["petroff", "Petrov's Defense"],
  ["vienna game", "Vienna Game"],
  ["kings gambit", "King's Gambit"],
  ["budapest", "Budapest Gambit"],
  ["trompowsky", "Trompowsky Attack"],
  ["torre attack", "Torre Attack"],
  ["colle system", "Colle System"],
  ["zukertort", "Zukertort Opening"],
  ["reti opening", "Reti Opening"],
  ["bird opening", "Bird Opening"],
  ["slav defense", "Slav Defense"],
  ["semi slav", "Semi-Slav Defense"],
  ["tarrasch", "Tarrasch Defense"],
  ["nimzowitsch defense", "Nimzowitsch Defense"],
  ["modern defense", "Modern Defense"],
  ["queens pawn", "Queen's Pawn Game"],
];

function simplifyOpeningName(raw: string): string {
  // Remove move notations like "2...Nf6", "3.e3", "2.Nf3" etc.
  let name = raw.replace(/\d+\.{1,3}\s*\S+/g, "").trim();
  // Remove trailing numbers and dots
  name = name.replace(/[\d.]+\s*$/, "").trim();

  // Check for known system names (longest match first)
  const sorted = [...SYSTEM_KEYWORDS].sort((a, b) => b[0].length - a[0].length);
  for (const [search, display] of sorted) {
    if (name.toLowerCase().includes(search)) {
      return display;
    }
  }

  // Fallback: take the first two meaningful words (the base opening name)
  const words = name.split(/\s+/).filter(Boolean);
  // Find a natural break — "Defense", "Game", "Opening", "Attack", "Gambit", "System"
  const breakWords = ["Defense", "Game", "Opening", "Attack", "Gambit", "System", "Variation"];
  for (let i = 0; i < words.length; i++) {
    if (breakWords.includes(words[i])) {
      return words.slice(0, i + 1).join(" ");
    }
  }

  return words.slice(0, 2).join(" ") || name;
}

function extractOpening(pgn: string): { name: string; slug: string } | null {
  const match = pgn.match(/\[ECOUrl "https:\/\/www\.chess\.com\/openings\/([^"]+)"\]/);
  if (match) {
    const slug = match[1];
    const rawName = slug.replace(/-/g, " ").replace(/\.\.\./g, "…");
    return { name: simplifyOpeningName(rawName), slug };
  }
  const nameMatch = pgn.match(/\[Opening "([^"]+)"\]/);
  if (nameMatch) {
    const rawName = nameMatch[1];
    const slug = rawName.replace(/\s+/g, "-").toLowerCase();
    return { name: simplifyOpeningName(rawName), slug };
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

function getLichessStudyUrl(name: string): string {
  // Map simplified name directly to Lichess opening URL format
  const slug = name.replace(/\s+/g, "_").replace(/'/g, "%27");
  return `https://lichess.org/opening/${slug}`;
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
  // Only consider games from the last 30 days
  const now = Date.now() / 1000;
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60;
  const recentGames = games.filter((g) => g.end_time >= thirtyDaysAgo);

  const openingMap = new Map<string, OpeningData>();

  for (const game of recentGames) {
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
                href={getLichessStudyUrl(o.name)}
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
