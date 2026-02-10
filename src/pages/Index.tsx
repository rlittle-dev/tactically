import { useState } from "react";
import { Clock, Zap, Gauge, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 chess-pattern pointer-events-none" />
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(ellipse 600px 400px at 30% 20%, hsl(0 0% 12% / 0.4), transparent)",
            "radial-gradient(ellipse 600px 400px at 70% 60%, hsl(0 0% 12% / 0.4), transparent)",
            "radial-gradient(ellipse 600px 400px at 30% 80%, hsl(0 0% 12% / 0.4), transparent)",
            "radial-gradient(ellipse 600px 400px at 30% 20%, hsl(0 0% 12% / 0.4), transparent)",
          ],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border-b border-border relative z-10 backdrop-blur-md bg-background/80"
      >
        <div className="container max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <button onClick={handleReset} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <motion.span
              className="text-foreground text-2xl"
              whileHover={{ rotate: [0, -15, 15, 0], scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              ♞
            </motion.span>
            <h1 className="text-xl font-display italic font-medium text-foreground tracking-wide">Tactically</h1>
          </button>
          <AnimatePresence mode="wait">
            {profile ? (
              <motion.button
                key="reset"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={handleReset}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                New Analysis
              </motion.button>
            ) : (
              <motion.p
                key="tagline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs tracking-[0.2em] uppercase text-muted-foreground hidden sm:block"
              >
                Chess Performance Analyzer
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="container max-w-5xl mx-auto px-4 py-16 relative z-10">
        {/* Hero / Search */}
        <AnimatePresence mode="wait">
          {showLanding && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-center mb-12 space-y-5"
            >
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-7xl font-display italic font-light text-foreground leading-[1.1]"
              >
                Analyze Your{" "}
                <motion.span
                  className="text-gradient font-medium inline-block"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  Chess
                </motion.span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed"
              >
                Enter your Chess.com username for a full breakdown of your strengths, weaknesses & performance.
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <UsernameSearch onSearch={handleSearch} loading={loading} />
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-4 max-w-md mx-auto"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {profile && stats && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <ProfileHeader profile={profile} />

              {/* Rating Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <RatingCard label="Rapid" icon={<Clock className="h-5 w-5" />} stats={stats.chess_rapid} delay={0} />
                <RatingCard label="Blitz" icon={<Zap className="h-5 w-5" />} stats={stats.chess_blitz} delay={1} />
                <RatingCard label="Bullet" icon={<Gauge className="h-5 w-5" />} stats={stats.chess_bullet} delay={2} />
                <PuzzleCard stats={stats} delay={3} />
              </div>

              {/* Chart + Recent Games */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3">
                  <RatingChart games={games} username={username} stats={stats} />
                </div>
                <div className="lg:col-span-2">
                  <RecentGames games={games} username={username} />
                </div>
              </div>

              {/* Insights */}
              <InsightsPanel stats={stats} games={games} username={username} />
            </motion.div>
          )}
        </AnimatePresence>
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
