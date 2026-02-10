# ♞ Tactically — Analyze Your Chess, Tactically

A sleek, real-time chess analytics dashboard that connects to the Chess.com API and Stockfish engine to deliver deep performance insights, rating trends, and AI-powered coaching recommendations.

**[Live Demo →](https://tactically.lovable.app)**

## Features

- **Rating Dashboard** — View current and best ratings across Rapid, Blitz, and Bullet formats with win/loss/draw breakdowns
- **Rating Trend Charts** — Interactive area charts tracking rating progression over time, switchable between Rapid, Blitz, and Bullet with date-based x-axis
- **Recent Matches** — Scrollable feed of recent games with results, opponents, ratings, and click-to-analyze
- **Top Openings** — Aggregates your most-played openings from the past 30 days with win percentage bars and links to free Lichess study resources
- **Puzzle Stats** — Puzzle rating and Puzzle Rush scores at a glance
- **AI-Powered Coaching** — Stockfish evaluates each position, then an AI model interprets the engine data for human-readable coaching insights, phase breakdowns, and practice recommendations
- **Evaluation Graph** — Per-move centipawn evaluation graph (clamped ±5 pawns) highlighting significant errors (≥1 pawn loss)
- **Profile Breakdown** — Analyzes recent games with Stockfish, then uses AI to identify recurring patterns, weaknesses, strengths, and personalized puzzle recommendations
- **PGN/FEN Upload** — Upload and analyze any PGN or FEN string with client-side validation to reject invalid input
- **Shareable Profile Cards** — Generate and download profile cards or copy share links (tactically.me/player/username)
- **Documentation** — In-app docs detailing data sources, engine analysis, and AI coaching methodology
- **Fluid Animations** — Apple-inspired motion design with staggered reveals, spring physics, and glassmorphism
- **Completely Free** — No account or payment required

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Chess Logic | chess.js |
| Backend | Lovable Cloud (Edge Functions) |
| AI | Gemini 3 Flash |
| Engine | Stockfish 17 NNUE (via chess-api.com, depth 16) |
| Data Source | Chess.com Public API |

## How It Works

1. Enter any Chess.com username
2. The app fetches profile data, stats, and recent games in parallel
3. Rating cards, trend charts, top openings, and recent matches render instantly
4. For game analysis, each position is evaluated by Stockfish 17 NNUE at depth 16 via chess-api.com
5. The AI coach interprets engine data to surface actionable insights — significant eval swings, best moves missed, and targeted training recommendations
6. PGN/FEN input is validated client-side using chess.js before any analysis begins

## Design

Dark gothic-modern aesthetic with a monochrome palette, Cormorant Garamond serif typography, and geometric chess-pattern backgrounds. Designed for clarity and elegance.

## Getting Started

```sh
npm install
npm run dev
```

## Documentation

Visit the in-app [Documentation page](/docs) for detailed information on data sources, engine analysis, AI coaching, and privacy.

## Support

Tactically is completely free. If you'd like to support the project, you can send USDT (ERC-20) to:

`0x9F213F387cD443A26c3a48c7B9816A4c067E36DE`

## License

MIT
