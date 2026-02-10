import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock, Zap, Gauge, RotateCcw, Github, Linkedin, TrendingUp, Brain, History,
  Share2, BookOpen, FileText, Puzzle, BarChart3, Shield, Sparkles, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UsernameSearch from "@/components/UsernameSearch";
import ProfileHeader from "@/components/ProfileHeader";
import RatingCard from "@/components/RatingCard";
import PuzzleCard from "@/components/PuzzleCard";
import RecentGames from "@/components/RecentGames";
import RatingChart from "@/components/RatingChart";
import TopOpenings from "@/components/TopOpenings";
import InsightsPanel from "@/components/InsightsPanel";
import PgnUpload from "@/components/PgnUpload";
import ProfileCardModal from "@/components/ProfileCardModal";
import { ChessProfile, ChessStats, RecentGame, fetchProfile, fetchStats, fetchRecentGames } from "@/lib/chess-api";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const FEATURES = [
  { icon: <TrendingUp className="h-5 w-5" />, title: "Rating Trends", desc: "Interactive charts tracking your Elo across Rapid, Blitz & Bullet with date-based timelines" },
  { icon: <Brain className="h-5 w-5" />, title: "AI Coaching", desc: "Stockfish 17 NNUE evaluates your games, then AI interprets the data into actionable coaching insights" },
  { icon: <BookOpen className="h-5 w-5" />, title: "Opening Repertoire", desc: "See your most-played openings with win rates and direct links to free Lichess study resources" },
  { icon: <History className="h-5 w-5" />, title: "Game History", desc: "Browse recent matches with results, opponents, and click any game for a deep-dive analysis" },
  { icon: <BarChart3 className="h-5 w-5" />, title: "Evaluation Graphs", desc: "Per-move centipawn evaluation charts highlighting critical moments and significant errors" },
  { icon: <FileText className="h-5 w-5" />, title: "PGN & FEN Analysis", desc: "Paste or upload any game for the same hybrid Stockfish + AI analysis pipeline" },
  { icon: <Puzzle className="h-5 w-5" />, title: "Puzzle & Training", desc: "Personalized puzzle recommendations targeting your specific weaknesses" },
  { icon: <Share2 className="h-5 w-5" />, title: "Shareable Cards", desc: "Generate beautiful profile cards to download or share with a unique link" },
];

const STEPS = [
  { num: "01", title: "Enter Username", desc: "Type any Chess.com username" },
  { num: "02", title: "Instant Dashboard", desc: "Ratings, trends & openings load in seconds" },
  { num: "03", title: "Deep Analysis", desc: "Stockfish + AI coaching on demand" },
];

const Index = () => {
  const { username: routeUsername } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ChessProfile | null>(null);
  const [stats, setStats] = useState<ChessStats | null>(null);
  const [games, setGames] = useState<RecentGame[]>([]);
  const [username, setUsername] = useState("");
  const [profileCardUsername, setProfileCardUsername] = useState<string | null>(null);

  useEffect(() => {
    if (routeUsername) setProfileCardUsername(routeUsername);
  }, [routeUsername]);

  const handleSearch = async (name: string) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    setStats(null);
    setGames([]);
    setUsername(name);
    try {
      const [p, s, g] = await Promise.all([fetchProfile(name), fetchStats(name), fetchRecentGames(name)]);
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
    <div className="min-h-screen bg-background relative flex flex-col">
      {/* Ambient glow + chess pattern */}
      <div className="absolute inset-0 bottom-auto pointer-events-none" style={{ bottom: 0 }}>
        <div className="chess-pattern" style={{ position: "absolute", inset: 0 }} />
        <motion.div
          animate={{ opacity: [0.03, 0.06, 0.03], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, hsl(0 0% 100% / 0.06) 0%, transparent 70%)" }}
        />
      </div>

      {/* Support Banner */}
      <div className="bg-accent/60 backdrop-blur-sm border-b border-border/50 text-center py-2 px-4 text-xs text-muted-foreground relative z-50">
        <span>Tactically is completely free — support the project via USDT (ERC-20): </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText("0x9F213F387cD443A26c3a48c7B9816A4c067E36DE");
            import("sonner").then(({ toast }) => toast.success("Address copied to clipboard!"));
          }}
          className="font-mono text-foreground hover:underline underline-offset-2 transition-colors"
        >
          0x9F213F...6DE
        </button>
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50"
      >
        <div className="container max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <motion.button onClick={handleReset} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <span className="text-foreground text-2xl">♞</span>
            <h1 className="text-xl font-display italic font-medium text-foreground tracking-wide">Tactically</h1>
          </motion.button>
          <AnimatePresence mode="wait">
            {profile ? (
              <motion.button key="reset" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onClick={handleReset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <RotateCcw className="h-4 w-4" />
                New Analysis
              </motion.button>
            ) : (
              <motion.div key="nav" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4">
                <Link to="/docs" className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Docs
                </Link>
                <a href="https://github.com/rlittle-dev/tactically" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  <Github className="h-4 w-4" />
                </a>
              </motion.div>
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
              className="text-center mb-14 space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/40 backdrop-blur-sm text-xs text-muted-foreground mb-2">
                <Shield className="h-3 w-3" />
                Free & open source — no account required
              </div>
              <h2 className="text-5xl sm:text-7xl font-display italic font-light text-foreground leading-[1.1]">
                Analyze Your <span className="text-gradient font-medium">Chess</span>, Tactically
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
                Deep performance analytics powered by Stockfish 17 and AI coaching. Enter any Chess.com username for a complete breakdown.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout transition={{ type: "spring", stiffness: 300, damping: 30 }} className="mb-12">
          <UsernameSearch onSearch={handleSearch} loading={loading} />
        </motion.div>

        <AnimatePresence>
          {showLanding && (
            <motion.div
              key="landing-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-16 mb-12"
            >
              {/* Sample Players */}
              <div className="text-center space-y-3">
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Try a sample player</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["hikaru", "GothamChess", "MagnusCarlsen", "AnishGiri"].map((name) => (
                    <motion.button
                      key={name}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSearch(name)}
                      className="px-4 py-2 rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors font-display italic"
                    >
                      {name}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                <motion.h3 variants={fadeUp} className="text-xs tracking-[0.15em] uppercase text-muted-foreground text-center">
                  How It Works
                </motion.h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {STEPS.map((step, i) => (
                    <motion.div
                      key={step.num}
                      variants={fadeUp}
                      className="relative flex flex-col items-center text-center gap-2 p-6 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm"
                    >
                      <span className="text-3xl font-display italic text-foreground/15 absolute top-3 left-4">{step.num}</span>
                      <h4 className="text-sm font-display italic font-medium text-foreground mt-2">{step.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                      {i < STEPS.length - 1 && (
                        <ChevronRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Feature Grid */}
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                <motion.div variants={fadeUp} className="text-center space-y-2">
                  <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Everything You Need</h3>
                  <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
                    A complete chess analytics suite — completely free, no sign-up required
                  </p>
                </motion.div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {FEATURES.map((f) => (
                    <motion.div
                      key={f.title}
                      variants={fadeUp}
                      whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                      className="flex flex-col gap-2.5 p-5 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm group"
                    >
                      <div className="text-muted-foreground group-hover:text-foreground transition-colors">{f.icon}</div>
                      <h4 className="text-sm font-display italic font-medium text-foreground">{f.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* PGN Upload */}
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
                <motion.h3 variants={fadeUp} className="text-xs tracking-[0.15em] uppercase text-muted-foreground text-center">
                  Or Analyze Any Game
                </motion.h3>
                <motion.div variants={fadeUp} className="max-w-lg mx-auto">
                  <PgnUpload />
                </motion.div>
              </motion.div>

              {/* Tech stack badge row */}
              <motion.div variants={stagger} initial="hidden" animate="show" className="text-center space-y-3">
                <motion.p variants={fadeUp} className="text-xs tracking-[0.15em] uppercase text-muted-foreground">
                  Powered By
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
                  {["Stockfish 17 NNUE", "Gemini AI", "Chess.com API", "Lichess"].map((t) => (
                    <span key={t} className="px-3 py-1.5 rounded-lg border border-border/40 bg-card/20 text-xs text-muted-foreground font-mono">
                      {t}
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-4 max-w-md mx-auto">
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {profile && stats && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
            <div className="flex items-center justify-between">
              <ProfileHeader profile={profile} />
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setProfileCardUsername(username)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/60 hover:border-foreground/30 shrink-0">
                <Share2 className="h-4 w-4" />
                Share Card
              </motion.button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <RatingCard label="Rapid" icon={<Clock className="h-5 w-5" />} stats={stats.chess_rapid} delay={100} />
              <RatingCard label="Blitz" icon={<Zap className="h-5 w-5" />} stats={stats.chess_blitz} delay={150} />
              <RatingCard label="Bullet" icon={<Gauge className="h-5 w-5" />} stats={stats.chess_bullet} delay={200} />
              <PuzzleCard stats={stats} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 space-y-4">
                <RatingChart games={games} username={username} stats={stats} />
                <TopOpenings games={games} username={username} />
              </div>
              <div className="lg:col-span-2">
                <RecentGames games={games} username={username} />
              </div>
            </div>

            <InsightsPanel stats={stats} games={games} username={username} />
          </motion.div>
        )}
      </main>

      <footer className="relative z-10 border-t border-border/50 bg-background mt-auto">
        <div className="container max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-5">
            <a href="https://github.com/rlittle-dev/tactically" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/in/ryan---little/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link>
            <span>·</span>
            <span>Open Source</span>
            <span>·</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>

      {profileCardUsername && (
        <ProfileCardModal
          username={profileCardUsername}
          onClose={() => {
            setProfileCardUsername(null);
            if (routeUsername) navigate("/");
          }}
        />
      )}
    </div>
  );
};

export default Index;