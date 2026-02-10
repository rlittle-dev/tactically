import { motion } from "framer-motion";
import { ArrowLeft, Database, Brain, BarChart3, Shield, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

const sections = [
  {
    icon: <Database className="h-5 w-5" />,
    title: "Data Sources",
    content: [
      { heading: "Chess.com Public API", text: "All player profiles, ratings, game history, and puzzle data are fetched from the Chess.com Public API. No authentication is required — we use only publicly available endpoints." },
      { heading: "chess-api.com", text: "Position evaluations are powered by chess-api.com, which runs Stockfish 17 NNUE at depth 16. Each position in a game is sent server-side for accurate engine analysis." },
    ],
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Engine Analysis",
    content: [
      { heading: "Evaluation Graph", text: "The eval graph shows centipawn scores (clamped to ±5 pawns) for every move in the game. Positive values favor White, negative favor Black." },
      { heading: "Move Analysis", text: "The engine identifies significant errors — moves that lose ≥1 pawn of evaluation — and highlights the best alternative move. This data is passed to the AI coach for context-aware feedback." },
    ],
  },
  {
    icon: <Brain className="h-5 w-5" />,
    title: "AI Coaching",
    content: [
      { heading: "Game Analysis", text: "Each game is analyzed in two phases: first by Stockfish for objective evaluation, then by an AI model that interprets the engine data to provide human-readable coaching insights including phase breakdowns, key moments, and practice recommendations." },
      { heading: "Profile Insights", text: "The profile breakdown analyzes your 5 most recent games with Stockfish, then uses AI to identify patterns in your play — recurring weaknesses, strengths, and personalized puzzle recommendations." },
    ],
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Privacy & Limitations",
    content: [
      { heading: "No Data Stored", text: "Tactically does not store any user data, game history, or analysis results. All processing happens in real-time and is discarded after your session." },
      { heading: "Rate Limits", text: "chess-api.com has usage limits. If analysis fails, it's typically due to rate limiting — try again after a few minutes." },
      { heading: "Analysis Depth", text: "Engine analysis runs at depth 16 which provides strong evaluations but may occasionally differ from deeper analysis on complex positions." },
    ],
  },
];

const Documentation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-border/50 backdrop-blur-xl bg-background/60 sticky top-0 z-50"
      >
        <div className="container max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <span className="text-foreground text-2xl">♞</span>
            <h1 className="text-xl font-display italic font-medium text-foreground tracking-wide">Tactically</h1>
          </button>
          <div className="w-16" />
        </div>
      </motion.header>

      <main className="container max-w-3xl mx-auto px-4 py-16 space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h2 className="text-4xl font-display italic font-light text-foreground">Documentation</h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
            How Tactically works — data sources, engine analysis, AI coaching, and privacy information.
          </p>
        </motion.div>

        <div className="space-y-10">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (i + 1) }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">{section.icon}</div>
                <h3 className="text-lg font-display italic font-medium text-foreground">{section.title}</h3>
              </div>
              <div className="space-y-4 pl-8">
                {section.content.map((item) => (
                  <div key={item.heading} className="space-y-1">
                    <h4 className="text-sm font-medium text-foreground">{item.heading}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="border-t border-border/50 pt-8 space-y-3"
        >
          <h3 className="text-sm font-display italic font-medium text-foreground">External Links</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Chess.com API Docs", url: "https://www.chess.com/news/view/published-data-api" },
              { label: "chess-api.com", url: "https://chess-api.com" },
              { label: "Stockfish", url: "https://stockfishchess.org" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/60 hover:border-foreground/30"
              >
                {link.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Documentation;
