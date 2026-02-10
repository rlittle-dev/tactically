import { useState } from "react";
import { ChessStats, RecentGame } from "@/lib/chess-api";
import { AIAnalysis, fetchAIAnalysis } from "@/lib/ai-analysis";
import {
  AlertTriangle, Info, CheckCircle, Loader2, ExternalLink,
  Swords, Target, Crown, Clock, Puzzle, Shield, Sparkles, Play,
} from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  stats: ChessStats;
  games: RecentGame[];
  username: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  opening: <Swords className="h-4 w-4" />,
  middlegame: <Target className="h-4 w-4" />,
  endgame: <Crown className="h-4 w-4" />,
  tactics: <Puzzle className="h-4 w-4" />,
  time_management: <Clock className="h-4 w-4" />,
  positional: <Shield className="h-4 w-4" />,
};

const severityConfig = {
  high: { icon: <AlertTriangle className="h-4 w-4" />, border: "border-destructive/40", text: "text-destructive", bg: "bg-destructive/10", label: "Critical" },
  medium: { icon: <Info className="h-4 w-4" />, border: "border-foreground/20", text: "text-foreground", bg: "bg-foreground/5", label: "Moderate" },
  low: { icon: <CheckCircle className="h-4 w-4" />, border: "border-success/40", text: "text-success", bg: "bg-success/10", label: "Minor" },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const InsightsPanel = ({ stats, games, username }: Props) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enginePhase, setEnginePhase] = useState<{ current: number; total: number } | null>(null);
  const [phase, setPhase] = useState<"idle" | "engine" | "ai" | "done">("idle");

  const gamesWithPgn = games.filter((g) => g.pgn);

  const startAnalysis = async () => {
    setLoading(true);
    setError(null);
    setPhase("engine");
    try {
      const result = await fetchAIAnalysis(
        username, stats, games,
        (current, total) => setEnginePhase({ current, total }),
        (p) => { setPhase(p); if (p === "ai") setEnginePhase(null); }
      );
      setPhase("done");
      setAnalysis(result);
    } catch (e: any) {
      setError(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="space-y-4"
    >
      <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Profile Breakdown</h3>

      {phase === "idle" && !analysis && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-8 flex flex-col items-center gap-4 text-center"
        >
          <p className="text-xs tracking-wide text-muted-foreground">
            <span className="font-display italic">{games.length}</span> games found · <span className="font-display italic">{gamesWithPgn.length}</span> with move data · engine analyzes top <span className="font-display italic">5</span>
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startAnalysis}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card hover:border-foreground/30 text-sm text-muted-foreground hover:text-foreground transition-colors font-display italic"
          >
            <Play className="h-3.5 w-3.5" />
            Start Breakdown
          </motion.button>
        </motion.div>
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-8 flex flex-col items-center gap-3"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          >
            <Loader2 className="h-6 w-6 text-muted-foreground" />
          </motion.div>
          {enginePhase ? (
            <>
              <p className="text-sm text-muted-foreground font-display italic">
                Analyzing game {enginePhase.current} of {enginePhase.total} with Stockfish…
              </p>
              <div className="w-48 bg-accent/30 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="h-full bg-foreground/60 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${(enginePhase.current / enginePhase.total) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </>
          ) : phase === "ai" ? (
            <p className="text-sm text-muted-foreground font-display italic">Generating AI coaching insights…</p>
          ) : (
            <p className="text-sm text-muted-foreground font-display italic">Initializing engine analysis…</p>
          )}
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {analysis && (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          {/* Overall Assessment */}
          <motion.div variants={fadeUp} className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h4 className="text-lg font-display italic text-foreground mb-1">Overall Assessment</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{analysis.overall_assessment}</p>
              </div>
            </div>
          </motion.div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <motion.div variants={fadeUp} className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5">
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-success" /> Strengths
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.strengths.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    whileHover={{ y: -2, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    className="bg-success/5 border border-success/20 rounded-xl p-4"
                  >
                    <p className="text-sm font-display italic text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <motion.div variants={fadeUp} className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5">
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Areas to Improve
              </h4>
              <div className="space-y-3">
                {analysis.weaknesses.map((w, i) => {
                  const cfg = severityConfig[w.severity] || severityConfig.medium;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i }}
                      className={`border ${cfg.border} rounded-xl p-4 ${cfg.bg}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${cfg.text} mt-0.5 shrink-0`}>
                          {categoryIcons[w.category] || cfg.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-display italic text-foreground">{w.title}</h5>
                            <span className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                              {cfg.label}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{w.category.replace("_", " ")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{w.description}</p>
                          {w.lichess_themes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {w.lichess_themes.map((theme) => (
                                <a
                                  key={theme}
                                  href={`https://lichess.org/training/${theme}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-card text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors"
                                >
                                  {theme}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Recommended Training */}
          {analysis.recommended_puzzles.length > 0 && (
            <motion.div variants={fadeUp} className="bg-card/80 backdrop-blur-xl border border-border rounded-xl p-5">
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <Puzzle className="h-3.5 w-3.5" /> Recommended Training
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.recommended_puzzles.map((p, i) => (
                  <motion.a
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                    whileHover={{ y: -3, transition: { type: "spring", stiffness: 400, damping: 25 } }}
                    href={`https://lichess.org/training/${p.theme}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card/60 border border-border rounded-xl p-4 hover:border-foreground/20 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-display italic text-foreground">{p.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.reason}</p>
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default InsightsPanel;
