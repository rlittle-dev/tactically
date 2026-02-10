import { useState } from "react";
import { RecentGame, ChessStats, getPlayerRating } from "@/lib/chess-api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

type Mode = "rapid" | "blitz" | "bullet";

interface Props {
  games: RecentGame[];
  username: string;
  stats?: ChessStats;
}

const MODE_CONFIG: { key: Mode; label: string }[] = [
  { key: "rapid", label: "Rapid" },
  { key: "blitz", label: "Blitz" },
  { key: "bullet", label: "Bullet" },
];

const RatingChart = ({ games, username, stats }: Props) => {
  const [mode, setMode] = useState<Mode>("rapid");

  const filteredGames = games.filter((g) => g.time_class === mode);

  const data = [...filteredGames].reverse().map((game, i) => ({
    game: i + 1,
    rating: getPlayerRating(game, username),
    date: new Date(game.end_time * 1000).toLocaleDateString(),
  }));

  const hasData = data.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Rating Trend</h3>
        <div className="flex gap-1">
          {MODE_CONFIG.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`relative px-2.5 py-1 text-xs uppercase tracking-wider rounded transition-colors ${
                mode === m.key
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {mode === m.key && (
                <motion.div
                  layoutId="chartTab"
                  className="absolute inset-0 bg-foreground/10 rounded"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{m.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          {hasData ? (
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 0%, 100%)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="hsl(0, 0%, 100%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 12%)" />
                  <XAxis
                    dataKey="game"
                    tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 11, fontFamily: "Cormorant Garamond" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={["dataMin - 20", "dataMax + 20"]}
                    tick={{ fill: "hsl(0, 0%, 40%)", fontSize: 12, fontFamily: "Cormorant Garamond" }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(0, 0%, 7%)",
                      border: "1px solid hsl(0, 0%, 14%)",
                      borderRadius: "6px",
                      fontFamily: "Cormorant Garamond",
                      fontSize: "14px",
                      fontStyle: "italic",
                    }}
                    labelStyle={{ color: "hsl(0, 0%, 40%)" }}
                    itemStyle={{ color: "hsl(0, 0%, 92%)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rating"
                    stroke="hsl(0, 0%, 70%)"
                    strokeWidth={1.5}
                    fill="url(#ratingGradient)"
                    dot={{ fill: "hsl(0, 0%, 92%)", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: "hsl(0, 0%, 100%)" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.p
              key={`empty-${mode}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm text-muted-foreground italic font-display"
            >
              Not enough recent {mode} games to chart
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default RatingChart;
