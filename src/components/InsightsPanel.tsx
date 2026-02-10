import { ChessStats, analyzeWeaknesses } from "@/lib/chess-api";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

interface Props {
  stats: ChessStats;
}

const severityConfig = {
  high: { icon: <AlertTriangle className="h-5 w-5" />, border: "border-destructive/40", text: "text-destructive", bg: "bg-destructive/10" },
  medium: { icon: <Info className="h-5 w-5" />, border: "border-primary/40", text: "text-primary", bg: "bg-primary/10" },
  low: { icon: <CheckCircle className="h-5 w-5" />, border: "border-success/40", text: "text-success", bg: "bg-success/10" },
};

const InsightsPanel = ({ stats }: Props) => {
  const insights = analyzeWeaknesses(stats);

  return (
    <div className="bg-card border border-border rounded-lg p-5 opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
      <h3 className="text-lg font-display italic font-semibold text-foreground mb-4">Profile Breakdown</h3>
      <div className="space-y-3">
        {insights.map((insight, i) => {
          const cfg = severityConfig[insight.severity];
          return (
            <div key={i} className={`border ${cfg.border} rounded-lg p-4 ${cfg.bg}`}>
              <div className="flex items-start gap-3">
                <div className={`${cfg.text} mt-0.5 shrink-0`}>{cfg.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{insight.area}</h4>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{insight.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightsPanel;
