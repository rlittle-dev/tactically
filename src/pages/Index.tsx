import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Clock, Zap, Gauge, RotateCcw, Github, Linkedin, TrendingUp, Brain, History,
  Share2, BookOpen, FileText, Puzzle, BarChart3, Sparkles, ChevronRight,
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

/* ── Scroll-triggered section wrapper ── */
const RevealSection = ({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ── Staggered grid children ── */
const RevealItem = ({
  children,
  className = "",
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

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
      <div className="absolute inset-0 pointer-events-none">
        <div className="chess-pattern" style={{ position: "absolute", inset: 0 }} />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, hsl(0 0% 100%) 0%, transparent 60%)" }}
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
              <motion.button
                key="support"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  navigator.clipboard.writeText("0x9F213F387cD443A26c3a48c7B9816A4c067E36DE");
                  import("sonner").then(({ toast }) => toast.success("USDT address copied to clipboard!"));
                }}
                className="text-xs tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors font-display italic"
              >
                Support the Project ♡
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      <main className="container max-w-5xl mx-auto px-4 py-16 relative z-10">
        {/* ── HERO ── */}
        <AnimatePresence mode="wait">
          {showLanding && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center mb-14 space-y-6"
            >
              <motion.h2
                className="text-5xl sm:text-7xl font-display italic font-light text-foreground leading-[1.1]"
              >
                Analyze Your{" "}
                <motion.span
                  className="text-gradient font-medium inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  Chess
                </motion.span>
                , Tactically
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed"
              >
                Deep performance analytics powered by Stockfish 17 and AI coaching. Enter any Chess.com username for a complete breakdown.
              </motion.p>
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="space-y-24 mb-16"
            >
              {/* ── Sample Players ── */}
              <RevealSection className="text-center space-y-4">
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Try a sample player</p>
              <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { username: "hikaru", display: "Hikaru", avatar: "https://images.chesscomfiles.com/uploads/v1/user/15448422.b6401265.50x50o.831ef3c4faa0.png" },
                    { username: "GothamChess", display: "Gotham Chess", avatar: "https://images.chesscomfiles.com/uploads/v1/user/49777928.8cae6ea0.50x50o.b1a3bfe4206d.png" },
                    { username: "MagnusCarlsen", display: "Magnus Carlsen", avatar: "https://images.chesscomfiles.com/uploads/v1/user/81726526.eb721fa8.50x50o.34a4ed4554d5.png" },
                    { username: "AnishGiri", display: "Anish Giri", avatar: "https://images.chesscomfiles.com/uploads/v1/user/33092908.14ceca84.50x50o.77a32e9d5766.png" },
                  ].map((player, i) => (
                    <motion.button
                      key={player.username}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.06, duration: 0.5 }}
                      whileHover={{ scale: 1.08, borderColor: "hsl(0 0% 30%)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSearch(player.username)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border/60 bg-card/50 backdrop-blur-sm text-sm text-muted-foreground hover:text-foreground transition-all font-display italic"
                    >
                      <img src={player.avatar} alt={player.display} className="w-5 h-5 rounded-full object-cover" />
                      {player.display}
                    </motion.button>
                  ))}
                </div>
              </RevealSection>

              {/* ── Divider ── */}
              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-md mx-auto" />

              {/* ── How It Works ── */}
              <RevealSection className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground">How It Works</h3>
                  <p className="text-sm text-muted-foreground/60">Three steps to your full chess breakdown</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  {STEPS.map((step, i) => (
                    <RevealItem key={step.num} index={i} className="relative">
                      <motion.div
                        whileHover={{
                          y: -4,
                          borderColor: "hsl(0 0% 24%)",
                          boxShadow: "0 8px 30px hsl(0 0% 100% / 0.03)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="flex flex-col items-center text-center gap-2.5 p-7 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm h-full"
                      >
                        <span className="text-4xl font-display italic text-foreground/10 absolute top-4 left-5">{step.num}</span>
                        <h4 className="text-sm font-display italic font-medium text-foreground mt-3">{step.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                      </motion.div>
                      {i < STEPS.length - 1 && (
                        <ChevronRight className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/20" />
                      )}
                    </RevealItem>
                  ))}
                </div>
              </RevealSection>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-md mx-auto" />

              {/* ── Feature Grid ── */}
              <RevealSection className="space-y-8">
                <div className="text-center space-y-2">
                  <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Everything You Need</h3>
                  <p className="text-sm text-muted-foreground/60 max-w-md mx-auto">
                    A complete chess analytics suite — completely free, no sign-up required
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {FEATURES.map((f, i) => (
                    <RevealItem key={f.title} index={i}>
                      <motion.div
                        whileHover={{
                          y: -5,
                          borderColor: "hsl(0 0% 24%)",
                          boxShadow: "0 12px 40px hsl(0 0% 100% / 0.04)",
                        }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="flex flex-col gap-3 p-5 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm group h-full"
                      >
                        <motion.div
                          className="text-muted-foreground group-hover:text-foreground transition-colors duration-300"
                          whileHover={{ rotate: [0, -8, 8, 0] }}
                          transition={{ duration: 0.4 }}
                        >
                          {f.icon}
                        </motion.div>
                        <h4 className="text-sm font-display italic font-medium text-foreground">{f.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                      </motion.div>
                    </RevealItem>
                  ))}
                </div>
              </RevealSection>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent max-w-md mx-auto" />

              {/* ── PGN Upload ── */}
              <RevealSection className="space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Or Analyze Any Game</h3>
                  <p className="text-sm text-muted-foreground/60">Paste a PGN or FEN for the same deep analysis</p>
                </div>
                <div className="max-w-lg mx-auto">
                  <PgnUpload />
                </div>
              </RevealSection>

              {/* ── Powered By ── */}
              <RevealSection className="text-center space-y-4">
                <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground">Powered By</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["Stockfish 17 NNUE", "Gemini AI", "Chess.com API", "Lichess"].map((t, i) => (
                    <motion.span
                      key={t}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="px-3.5 py-1.5 rounded-lg border border-border/40 bg-card/20 text-xs text-muted-foreground font-mono hover:border-foreground/20 hover:text-foreground transition-colors"
                    >
                      {t}
                    </motion.span>
                  ))}
                </div>
              </RevealSection>
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

        {/* ── Dashboard ── */}
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

            <RevealSection>
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 space-y-4">
                  <RatingChart games={games} username={username} stats={stats} />
                  <TopOpenings games={games} username={username} />
                </div>
                <div className="lg:col-span-2">
                  <RecentGames games={games} username={username} />
                </div>
              </div>
            </RevealSection>

            <RevealSection>
              <InsightsPanel stats={stats} games={games} username={username} />
            </RevealSection>
          </motion.div>
        )}
      </main>

      <footer className="relative z-10 border-t border-border/50 bg-background mt-auto">
        <RevealSection className="container max-w-5xl mx-auto px-4 py-8 flex flex-col items-center gap-4 text-sm text-muted-foreground">
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
        </RevealSection>
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
