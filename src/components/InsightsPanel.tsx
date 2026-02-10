import { useState, useEffect } from "react";
import { ChessStats, RecentGame } from "@/lib/chess-api";
import { AIAnalysis, fetchAIAnalysis } from "@/lib/ai-analysis";
import {
  AlertTriangle,
  Info,
  CheckCircle,
  Loader2,
  ExternalLink,
  Swords,
  Target,
  Crown,
  Clock,
  Puzzle,
  Shield,
  Sparkles,
} from "lucide-react";

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
  high: {
    icon: <AlertTriangle className="h-4 w-4" />,
    border: "border-destructive/40",
    text: "text-destructive",
    bg: "bg-destructive/10",
    label: "Critical",
  },
  medium: {
    icon: <Info className="h-4 w-4" />,
    border: "border-foreground/20",
    text: "text-foreground",
    bg: "bg-foreground/5",
    label: "Moderate",
  },
  low: {
    icon: <CheckCircle className="h-4 w-4" />,
    border: "border-success/40",
    text: "text-success",
    bg: "bg-success/10",
    label: "Minor",
  },
};

const InsightsPanel = ({ stats, games, username }: Props) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAIAnalysis(username, stats, games);
        if (!cancelled) setAnalysis(result);
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Analysis failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [username, stats, games]);

  return (
    <div className="space-y-4 opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
      <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
        Profile Breakdown
      </h3>

      {loading && (
        <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-display italic">Analyzing your games…</p>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {analysis && (
        <>
          {/* Overall Assessment */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h4 className="text-lg font-display italic text-foreground mb-1">Overall Assessment</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.overall_assessment}
                </p>
              </div>
            </div>
          </div>

          {/* Strengths */}
          {analysis.strengths.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-success" /> Strengths
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.strengths.map((s, i) => (
                  <div key={i} className="bg-success/5 border border-success/20 rounded-lg p-4">
                    <p className="text-sm font-display italic text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weaknesses */}
          {analysis.weaknesses.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Areas to Improve
              </h4>
              <div className="space-y-3">
                {analysis.weaknesses.map((w, i) => {
                  const cfg = severityConfig[w.severity] || severityConfig.medium;
                  return (
                    <div key={i} className={`border ${cfg.border} rounded-lg p-4 ${cfg.bg}`}>
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
                          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                            {w.description}
                          </p>
                          {w.lichess_themes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {w.lichess_themes.map((theme) => (
                                <a
                                  key={theme}
                                  href={`https://lichess.org/training/${theme}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-card text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20 transition-colors"
                                >
                                  {theme}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommended Training */}
          {analysis.recommended_puzzles.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h4 className="text-xs uppercase tracking-[0.15em] text-muted-foreground mb-3 flex items-center gap-2">
                <Puzzle className="h-3.5 w-3.5" /> Recommended Training
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analysis.recommended_puzzles.map((p, i) => (
                  <a
                    key={i}
                    href={`https://lichess.org/training/${p.theme}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card border border-border rounded-lg p-4 hover:border-foreground/20 transition-all card-hover"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-display italic text-foreground">{p.label}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.reason}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InsightsPanel;
