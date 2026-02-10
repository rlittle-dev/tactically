import { useState } from "react";
import { Clock, Zap, Gauge, RotateCcw } from "lucide-react";
import UsernameSearch from "@/components/UsernameSearch";
import ProfileHeader from "@/components/ProfileHeader";
import RatingCard from "@/components/RatingCard";
import PuzzleCard from "@/components/PuzzleCard";
import RecentGames from "@/components/RecentGames";
import RatingChart from "@/components/RatingChart";
import InsightsPanel from "@/components/InsightsPanel";
import {
  ChessProfile,
  ChessStats,
  RecentGame,
  fetchProfile,
  fetchStats,
  fetchRecentGames,
} from "@/lib/chess-api";

const Index = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ChessProfile | null>(null);
  const [stats, setStats] = useState<ChessStats | null>(null);
  const [games, setGames] = useState<RecentGame[]>([]);
  const [username, setUsername] = useState("");

  const handleSearch = async (name: string) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    setStats(null);
    setGames([]);
    setUsername(name);

    try {
      const [p, s, g] = await Promise.all([
        fetchProfile(name),
        fetchStats(name),
        fetchRecentGames(name),
      ]);
      setProfile(p);
      setStats(s);
      setGames(g);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setProfile(null);
    setStats(null);
    setGames([]);
    setUsername("");
    setError(null);
  };

  const showLanding = !profile && !loading;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Full-page chess pattern */}
      <div className="fixed inset-0 chess-pattern pointer-events-none" />

      {/* Header */}
      <header className="border-b border-border relative z-10">
        <div className="container max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-foreground text-2xl">♞</span>
            <h1 className="text-xl font-display italic font-medium text-foreground tracking-wide">Tactically</h1>
          </button>
          {profile ? (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              New Analysis
            </button>
          ) : (
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground hidden sm:block">Chess Performance Analyzer</p>
          )}
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-16 relative z-10">
        {/* Hero / Search */}
        {showLanding && (
          <div className="text-center mb-12 space-y-5">
            <h2 className="text-5xl sm:text-7xl font-display italic font-light text-foreground leading-[1.1]">
              Analyze Your <span className="text-gradient font-medium">Chess</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
              Enter your Chess.com username for a full breakdown of your strengths, weaknesses & performance.
            </p>
          </div>
        )}

        <div className="mb-12">
          <UsernameSearch onSearch={handleSearch} loading={loading} />
        </div>

        {error && (
          <div className="text-center text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-4 max-w-md mx-auto">
            {error}
          </div>
        )}

        {profile && stats && (
          <div className="space-y-6">
            <ProfileHeader profile={profile} />

            {/* Rating Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <RatingCard label="Rapid" icon={<Clock className="h-5 w-5" />} stats={stats.chess_rapid} delay={100} />
              <RatingCard label="Blitz" icon={<Zap className="h-5 w-5" />} stats={stats.chess_blitz} delay={150} />
              <RatingCard label="Bullet" icon={<Gauge className="h-5 w-5" />} stats={stats.chess_bullet} delay={200} />
              <PuzzleCard stats={stats} />
            </div>

            {/* Chart + Recent Games */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RatingChart games={games} username={username} />
              <RecentGames games={games} username={username} />
            </div>

            {/* Insights */}
            <InsightsPanel stats={stats} />
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-20 relative z-10">
        <div className="container max-w-5xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Powered by the Chess.com Public API
        </div>
      </footer>
    </div>
  );
};

export default Index;
