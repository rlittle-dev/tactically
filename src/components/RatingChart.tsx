import { useState } from "react";
import { RecentGame, ChessStats, getPlayerRating } from "@/lib/chess-api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Mode = "rapid" | "blitz" | "bullet";

interface Props {
  games: RecentGame[];
  username: string;
  stats?: ChessStats;
}

const MODE_CONFIG: { key: Mode; label: string; timeClass: string }[] = [
  { key: "rapid", label: "Rapid", timeClass: "rapid" },
  { key: "blitz", label: "Blitz", timeClass: "blitz" },
  { key: "bullet", label: "Bullet", timeClass: "bullet" },
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
    <div className="bg-card border border-border rounded-lg p-5 opacity-0 animate-fade-in" style={{ animationDelay: "350ms" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Rating Trend</h3>
        <div className="flex gap-1">
          {MODE_CONFIG.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className={`px-2.5 py-1 text-xs uppercase tracking-wider rounded transition-colors ${
                mode === m.key
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[280px] flex items-center justify-center">
        {hasData ? (
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
        ) : (
          <p className="text-sm text-muted-foreground italic font-display">
            Not enough recent {mode} games to chart
          </p>
        )}
      </div>
    </div>
  );
};

export default RatingChart;
