# ♞ Tactically — Analyze Your Chess, Tactically

A sleek, real-time chess analytics dashboard that connects to the Chess.com API and Stockfish engine to deliver deep performance insights, rating trends, and AI-powered coaching recommendations.

**[Live Demo →](https://tactically.lovable.app)**

## Features

- **Rating Dashboard** — View current and best ratings across Rapid, Blitz, and Bullet formats with win/loss/draw breakdowns
- **Rating Trend Charts** — Interactive area charts tracking rating progression over recent games
- **Recent Matches** — Scrollable feed of recent games with results, opponents, and ratings
- **Puzzle Stats** — Puzzle rating and Puzzle Rush scores at a glance
- **AI-Powered Coaching** — Stockfish evaluates each position, then an AI model interprets the engine data for human-readable coaching insights, phase breakdowns, and practice recommendations
- **Evaluation Graph** — Per-move centipawn evaluation graph (clamped ±5 pawns) highlighting significant errors (≥1 pawn loss)
- **Profile Insights** — Analyzes your 5 most recent games with Stockfish, then uses AI to identify recurring patterns, weaknesses, strengths, and personalized puzzle recommendations
- **PGN Upload** — Upload and analyze any PGN file directly
- **Shareable Profile Cards** — Generate and download profile cards or copy share links (tactically.me/player/username)
- **Documentation** — In-app docs detailing data sources, engine analysis, and AI coaching methodology
- **Fluid Animations** — Apple-inspired motion design with staggered reveals, spring physics, and glassmorphism

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Backend | Lovable Cloud (Edge Functions) |
| AI | Gemini 3 Flash (via Lovable AI) |
| Engine | Stockfish 17 NNUE (via chess-api.com, depth 16) |
| Data Source | Chess.com Public API |

## How It Works

1. Enter any Chess.com username
2. The app fetches profile data, stats, and recent games in parallel
3. Rating cards and trend charts render instantly
4. For game analysis, each position is evaluated by Stockfish 17 NNUE at depth 16 via chess-api.com
5. The AI coach interprets engine data to surface actionable insights — significant eval swings, best moves missed, and targeted training recommendations

## Design

Dark gothic-modern aesthetic with a monochrome palette, Cormorant Garamond serif typography, and geometric chess-pattern backgrounds. Designed for clarity and elegance.

## Getting Started

```sh
npm install
npm run dev
```

## Documentation

Visit the in-app [Documentation page](/docs) for detailed information on data sources, engine analysis, AI coaching, and privacy.

## License

MIT
