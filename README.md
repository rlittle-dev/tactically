# ♞ Tactically — Chess Performance Analyzer

A sleek, real-time chess analytics dashboard that connects to the Chess.com API to deliver deep performance insights, rating trends, and AI-powered coaching recommendations.

**[Live Demo →](https://tactically.lovable.app)**

## Features

- **Rating Dashboard** — View current and best ratings across Rapid, Blitz, and Bullet formats with win/loss/draw breakdowns
- **Rating Trend Charts** — Interactive area charts tracking rating progression over recent games
- **Recent Matches** — Scrollable feed of recent games with results, opponents, and ratings
- **Puzzle Stats** — Puzzle rating and Puzzle Rush scores at a glance
- **AI-Powered Analysis** — Identifies strengths, weaknesses, and recommends targeted Lichess training puzzles
- **Game-Specific Analysis** — Deep-dive into individual matches with phase breakdowns, critical mistakes, and practice recommendations
- **PGN Upload** — Upload and analyze any PGN file directly
- **Shareable Profile Cards** — Generate and download profile cards or copy share links (tactically.me/player/username)
- **Support Banner** — USDT donation address with click-to-copy
- **Fluid Animations** — Apple-inspired motion design with staggered reveals, spring physics, and glassmorphism

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Vite |
| Styling | Tailwind CSS, Framer Motion |
| Charts | Recharts |
| Backend | Supabase Edge Functions |
| AI | Gemini 3 Flash |
| Data Source | Chess.com Public API |

## How It Works

1. Enter any Chess.com username
2. The app fetches profile data, stats, and recent games in parallel
3. Rating cards and trend charts render instantly
4. An AI coach analyzes game patterns and surfaces actionable insights

## Design

Dark gothic-modern aesthetic with a monochrome palette, Cormorant Garamond serif typography, and geometric chess-pattern backgrounds. Designed for clarity and elegance.

## Getting Started

```sh
npm install
npm run dev
