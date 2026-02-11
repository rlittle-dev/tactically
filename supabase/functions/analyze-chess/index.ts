import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stats, games, username, engineAnalysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build a compact summary of the player's data for the AI
    const gamesSummary = (games || []).slice(0, 10).map((g: any) => {
      const isWhite = g.white?.username?.toLowerCase() === username?.toLowerCase();
      const player = isWhite ? g.white : g.black;
      const opponent = isWhite ? g.black : g.white;
      const moveCount = g.pgn ? (g.pgn.match(/\d+\./g) || []).length : null;
      return {
        result: player.result,
        playerRating: player.rating,
        opponentRating: opponent.rating,
        timeClass: g.time_class,
        moveCount,
        pgn: g.pgn ? g.pgn.slice(-500) : null,
      };
    });

    // Build structured engine context from pre-classified mistakes
    let engineContext = "";
    if (engineAnalysis?.details?.length > 0) {
      const mistakeLines = engineAnalysis.details.map((m: any) =>
        `- Game ${m.game}, ${m.moveNumber}${m.color === "w" ? "." : "..."} ${m.played} [${m.classification.toUpperCase()}, lost ${m.cpLoss}cp, ${m.phase}] → best was ${m.bestMove}`
      );
      engineContext = `\n\nSTOCKFISH ENGINE ANALYSIS (depth ${engineAnalysis.depth || 16}, ${engineAnalysis.gamesAnalyzed} games):
Summary: ${engineAnalysis.blunders} blunders, ${engineAnalysis.mistakes} mistakes, ${engineAnalysis.inaccuracies} inaccuracies
By phase: Opening ${engineAnalysis.byPhase.opening}, Middlegame ${engineAnalysis.byPhase.middlegame}, Endgame ${engineAnalysis.byPhase.endgame}

Pre-classified errors (use ONLY these — do NOT invent additional ones):
${mistakeLines.join("\n")}

CRITICAL: Base your weaknesses ONLY on patterns from the errors above. Do NOT hallucinate moves or positions.`;
    } else if (engineAnalysis) {
      engineContext = "\n\nStockfish analysis found no significant errors across the analyzed games.";
    }

    // Determine player's rating tier for ELO-appropriate recommendations
    const ratings = [
      stats.chess_rapid?.last?.rating,
      stats.chess_blitz?.last?.rating,
      stats.chess_bullet?.last?.rating,
    ].filter(Boolean) as number[];
    const avgRating = ratings.length > 0 ? Math.round(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) : null;
    const bestRating = Math.max(...(
      [stats.chess_rapid?.best?.rating, stats.chess_blitz?.best?.rating, stats.chess_bullet?.best?.rating].filter(Boolean) as number[]
    ), 0);

    let ratingTier = "intermediate";
    let ratingContext = "";
    if (avgRating) {
      if (avgRating >= 2500 || bestRating >= 2600) {
        ratingTier = "super_gm";
        ratingContext = `This player is a SUPER GM level player (~${avgRating}+). Do NOT recommend basic concepts like "opening principles", "piece development", "king safety basics", or "basic tactics". Focus on extremely advanced themes: deep prophylaxis, complex endgame theory, preparation gaps, subtle positional nuances, advanced pawn structure understanding, and sophisticated calculation.`;
      } else if (avgRating >= 2200) {
        ratingTier = "master";
        ratingContext = `This player is MASTER level (~${avgRating}). Do NOT recommend beginner/intermediate concepts. Focus on advanced themes: sophisticated endgame technique, deep calculation, strategic planning, preparation quality, and subtle positional concepts.`;
      } else if (avgRating >= 1800) {
        ratingTier = "advanced";
        ratingContext = `This player is ADVANCED level (~${avgRating}). Recommendations should focus on intermediate-to-advanced concepts: complex tactics, positional understanding, endgame technique, and strategic planning.`;
      } else if (avgRating >= 1200) {
        ratingTier = "intermediate";
        ratingContext = `This player is INTERMEDIATE level (~${avgRating}). Recommendations can include pattern recognition, tactical motifs, basic endgame principles, and opening understanding.`;
      } else {
        ratingTier = "beginner";
        ratingContext = `This player is a BEGINNER (~${avgRating}). Focus on fundamental concepts: piece safety, basic checkmate patterns, simple tactics, and opening principles.`;
      }
    }

    const prompt = `You are an expert chess coach writing a profile-level overview for a Chess.com player. Focus on BROAD PATTERNS and CONSISTENT TENDENCIES — NOT specific moves or individual game moments.

PLAYER: ${username}
RATING TIER: ${ratingTier} ${avgRating ? `(avg ~${avgRating}, best ${bestRating})` : ""}
${ratingContext}
${engineContext}

STATS:
- Rapid: ${stats.chess_rapid ? `Rating ${stats.chess_rapid.last.rating}, Best ${stats.chess_rapid.best.rating}, W/L/D: ${stats.chess_rapid.record.win}/${stats.chess_rapid.record.loss}/${stats.chess_rapid.record.draw}` : "N/A"}
- Blitz: ${stats.chess_blitz ? `Rating ${stats.chess_blitz.last.rating}, Best ${stats.chess_blitz.best.rating}, W/L/D: ${stats.chess_blitz.record.win}/${stats.chess_blitz.record.loss}/${stats.chess_blitz.record.draw}` : "N/A"}
- Bullet: ${stats.chess_bullet ? `Rating ${stats.chess_bullet.last.rating}, Best ${stats.chess_bullet.best.rating}, W/L/D: ${stats.chess_bullet.record.win}/${stats.chess_bullet.record.loss}/${stats.chess_bullet.record.draw}` : "N/A"}
- Puzzle Rating: ${stats.tactics?.highest?.rating || "N/A"}
- Puzzle Rush Best: ${stats.puzzle_rush?.best?.score || "N/A"}

RECENT GAMES (last 10):
${JSON.stringify(gamesSummary, null, 1)}

Analyze and respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "weaknesses": [
    {
      "category": "opening" | "middlegame" | "endgame" | "tactics" | "time_management" | "positional",
      "title": "short trend-based title (e.g. 'Weak endgame technique', 'Misses tactical patterns')",
      "description": "2-3 sentences describing the recurring pattern across games, NOT referencing specific moves or game numbers",
      "severity": "high" | "medium" | "low",
      "lichess_themes": ["theme1", "theme2"]
    }
  ],
  "strengths": [
    {
      "title": "short trend-based title",
      "description": "1-2 sentences describing a consistent strength across multiple games"
    }
  ],
  "overall_assessment": "2-3 sentence high-level summary of the player's style, rating trajectory, and main areas for growth. Do NOT mention specific moves.",
  "recommended_puzzles": [
    {
      "theme": "valid Lichess training theme slug",
      "label": "Human readable label",
      "reason": "Why this addresses a pattern in their play (not a single game moment)"
    }
  ]
}

CRITICAL RULES:
- NEVER reference specific move numbers, game numbers, or individual positions
- Focus on patterns like "tends to leave pieces undefended", "strong opening preparation", "struggles to convert winning endgames"
- Weaknesses and strengths should be trends observable across MULTIPLE games
- Recommendations should address habitual issues, not one-off mistakes
- ${ratingContext ? "MOST IMPORTANT: Tailor ALL recommendations to the player's rating tier. " + ratingContext : ""}

For lichess_themes and recommended_puzzles.theme, use valid Lichess training theme slugs like: opening, middlegame, endgame, short, long, mateIn1, mateIn2, mateIn3, fork, pin, skewer, hangingPiece, trappedPiece, discoveredAttack, doubleCheck, sacrifice, deflection, decoy, backRankMate, kingsideAttack, queensideAttack, advancedPawn, quietMove, xRayAttack, interference, exposedKing, attraction, clearance, zugzwang.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an expert chess coach. Always respond with valid JSON only. No markdown formatting." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the AI response
    let analysis;
    try {
      // Try to extract JSON if wrapped in code fences
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse analysis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-chess error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
