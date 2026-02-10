import { RecentGame, getPlayerRating } from "@/lib/chess-api";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
  games: RecentGame[];
  username: string;
}

const RatingChart = ({ games, username }: Props) => {
  if (games.length < 2) return null;

  const data = [...games].reverse().map((game, i) => ({
    game: i + 1,
    rating: getPlayerRating(game, username),
    date: new Date(game.end_time * 1000).toLocaleDateString(),
  }));

  return (
    <div className="bg-card border border-border rounded-lg p-5 opacity-0 animate-fade-in" style={{ animationDelay: "350ms" }}>
      <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-4">Rating Trend</h3>
      <div className="h-[280px]">
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
      </div>
    </div>
  );
};

export default RatingChart;
