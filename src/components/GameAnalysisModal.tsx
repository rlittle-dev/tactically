import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Target, CheckCircle2, AlertTriangle, BookOpen, Loader2, ExternalLink } from "lucide-react";
import { RecentGame, getResult, getOpponentName, getOpponentRating, getPlayerRating } from "@/lib/chess-api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GameAnalysis {
  summary: string;
  phases: {
    phase: string;
    assessment: string;
    moves: string;
    explanation: string;
    key_moment: string;
    suggestion: string;
  }[];
  critical_mistakes: {
    move: string;
    why_bad: string;
    better_move: string;
  }[];
  things_done_well: {
    description: string;
    move_range: string;
  }[];
  practice_recommendations: {
    theme: string;
    label: string;
    reason: string;
    priority: string;
  }[];
  opening_name?: string;
}

interface Props {
  game: RecentGame;
  username: string;
  onClose: () => void;
}

const phaseAssessmentConfig = {
  good: { color: "text-success", bg: "bg-success/10", icon: <CheckCircle2 className="h-4 w-4" /> },
  okay: { color: "text-yellow-400", bg: "bg-yellow-400/10", icon: <AlertTriangle className="h-4 w-4" /> },
  poor: { color: "text-destructive", bg: "bg-destructive/10", icon: <X className="h-4 w-4" /> },
};

const priorityColors = {
  high: "border-destructive/40 text-destructive",
  medium: "border-yellow-400/40 text-yellow-400",
  low: "border-muted-foreground/40 text-muted-foreground",
};

const GameAnalysisModal = ({ game, username, onClose }: Props) => {
  const [analysis, setAnalysis] = useState<GameAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const result = getResult(game, username);
  const opponent = getOpponentName(game, username);
  const oppRating = getOpponentRating(game, username);
  const myRating = getPlayerRating(game, username);

  useState(() => {
    const analyze = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("analyze-game", {
          body: {
            pgn: game.pgn,
            username,
            opponent,
            result,
            timeClass: game.time_class,
            playerRating: myRating,
            opponentRating: oppRating,
          },
        });

        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);
        setAnalysis(data);
      } catch (e: any) {
        const msg = e.message || "Failed to analyze game";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    analyze();
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-card border border-border rounded-xl shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-xl border-b border-border p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  result === "win" ? "bg-success/10 text-success" :
                  result === "loss" ? "bg-destructive/10 text-destructive" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {result.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{game.time_class}</span>
              </div>
              <h2 className="text-lg font-display italic text-foreground">
                {username} ({myRating}) vs {opponent} ({oppRating})
              </h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5 space-y-6">
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-display italic">Analyzing game with AI...</p>
              </div>
            )}

            {error && (
              <div className="text-center text-destructive bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                {error}
              </div>
            )}

            {analysis && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                {/* Opening & Summary */}
                <div>
                  {analysis.opening_name && (
                    <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">
                      {analysis.opening_name}
                    </p>
                  )}
                  <p className="text-sm text-foreground/80 leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Phase Breakdown */}
                <div>
                  <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Phase Breakdown</h3>
                  <div className="space-y-3">
                    {analysis.phases.map((phase, i) => {
                      const cfg = phaseAssessmentConfig[phase.assessment as keyof typeof phaseAssessmentConfig] || phaseAssessmentConfig.okay;
                      return (
                        <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${cfg.bg} ${cfg.color}`}>{cfg.icon}</div>
                              <span className="text-sm font-display italic capitalize text-foreground">{phase.phase}</span>
                              <span className="text-xs text-muted-foreground">({phase.moves})</span>
                            </div>
                            <span className={`text-xs font-medium capitalize ${cfg.color}`}>{phase.assessment}</span>
                          </div>
                          <p className="text-xs text-foreground/70 leading-relaxed">{phase.explanation}</p>
                          {phase.key_moment && (
                            <p className="text-xs text-muted-foreground italic">
                              <span className="text-foreground/60">Key moment:</span> {phase.key_moment}
                            </p>
                          )}
                          {phase.suggestion && (
                            <p className="text-xs text-muted-foreground">
                              <span className="text-foreground/60">💡 Suggestion:</span> {phase.suggestion}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Critical Mistakes */}
                {analysis.critical_mistakes.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Critical Mistakes</h3>
                    <div className="space-y-2">
                      {analysis.critical_mistakes.map((mistake, i) => (
                        <div key={i} className="border border-destructive/20 rounded-lg p-3 space-y-1">
                          <p className="text-sm font-mono text-destructive">{mistake.move}</p>
                          <p className="text-xs text-foreground/70">{mistake.why_bad}</p>
                          <p className="text-xs text-success/80">
                            <span className="text-foreground/60">Better:</span> {mistake.better_move}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Things Done Well */}
                {analysis.things_done_well.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">What You Did Well</h3>
                    <div className="space-y-2">
                      {analysis.things_done_well.map((item, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-foreground/80">{item.description}</p>
                            <p className="text-xs text-muted-foreground">{item.move_range}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practice Recommendations */}
                <div>
                  <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3">Practice This</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysis.practice_recommendations.map((rec, i) => (
                      <a
                        key={i}
                        href={`https://lichess.org/training/${rec.theme}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`border rounded-lg p-3 flex items-start gap-3 hover:bg-accent/50 transition-colors group ${
                          priorityColors[rec.priority as keyof typeof priorityColors] || priorityColors.medium
                        }`}
                      >
                        <Target className="h-4 w-4 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-foreground font-display italic">{rec.label}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{rec.reason}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* View on Chess.com */}
                <div className="pt-2 border-t border-border">
                  <a
                    href={game.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    View full game on Chess.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GameAnalysisModal;
