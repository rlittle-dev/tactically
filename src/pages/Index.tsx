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
  ChessProfile, ChessStats, RecentGame,
  fetchProfile, fetchStats, fetchRecentGames,
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
        fetchProfile(name), fetchStats(name), fetchRecentGames(name),
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
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="chess-pattern" style={{ position: "absolute", inset: 0 }} />
        <motion.div
          animate={{
            opacity: [0.03, 0.06, 0.03],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(0 0% 100% / 0.06) 0%, transparent 70%)" }}
        />
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50"
      >
        <div className="container max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <motion.button
            onClick={handleReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-foreground text-2xl">♞</span>
            <h1 className="text-xl font-display italic font-medium text-foreground tracking-wide">Tactically</h1>
          </motion.button>
          <AnimatePresence mode="wait">
            {profile ? (
              <motion.button
                key="reset"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                New Analysis
              </motion.button>
            ) : (
              <motion.p
                key="subtitle"
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
        <AnimatePresence mode="wait">
          {showLanding && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="text-center mb-12 space-y-5"
            >
              <h2 className="text-5xl sm:text-7xl font-display italic font-light text-foreground leading-[1.1]">
                Analyze Your <span className="text-gradient font-medium">Chess</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-sm mx-auto leading-relaxed">
                Enter your Chess.com username for a full breakdown of your strengths, weaknesses & performance.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
              className="text-center text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-4 max-w-md mx-auto"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {profile && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <ProfileHeader profile={profile} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <RatingCard label="Rapid" icon={<Clock className="h-5 w-5" />} stats={stats.chess_rapid} delay={100} />
              <RatingCard label="Blitz" icon={<Zap className="h-5 w-5" />} stats={stats.chess_blitz} delay={150} />
              <RatingCard label="Bullet" icon={<Gauge className="h-5 w-5" />} stats={stats.chess_bullet} delay={200} />
              <PuzzleCard stats={stats} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3">
                <RatingChart games={games} username={username} stats={stats} />
              </div>
              <div className="lg:col-span-2">
                <RecentGames games={games} username={username} />
              </div>
            </div>

            <InsightsPanel stats={stats} games={games} username={username} />
          </motion.div>
        )}
      </main>

      <footer className="border-t border-border/50 mt-20 relative z-10">
        <div className="container max-w-5xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Powered by the Chess.com Public API
        </div>
      </footer>
    </div>
  );
};

export default Index;
