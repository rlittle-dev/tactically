import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { pgn, username, opponent, result, timeClass, playerRating, opponentRating, engineAnalysis } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!pgn) {
      return new Response(JSON.stringify({ error: "No PGN data available for this game" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build context - handle both full game data and raw PGN uploads
    const hasMetadata = username && opponent;
    const playerContext = hasMetadata
      ? `PLAYER: ${username} (${playerRating})\nOPPONENT: ${opponent} (${opponentRating})\nTIME CONTROL: ${timeClass}\nRESULT: ${result}`
      : "This is an uploaded PGN. Extract player names, ratings, and result from the PGN headers if available.";

    // Include Stockfish engine data if available
    const engineContext = engineAnalysis
      ? `\n\nSTOCKFISH ENGINE ANALYSIS (depth ${engineAnalysis.depth || 14}):\n${engineAnalysis.summary}\n\nIMPORTANT: Use the engine evaluation data above to ground your analysis. The centipawn losses identify the actual blunders and mistakes — reference these specific moves and explain WHY they were bad positionally/tactically.`
      : "";

    const prompt = `You are an expert chess coach performing a detailed post-game analysis. Analyze this specific game and provide actionable feedback.

${playerContext}
${engineContext}

PGN:
${pgn}

Analyze this game thoroughly and respond with ONLY valid JSON (no markdown, no code fences) in this exact format:
{
  "summary": "2-3 sentence overall summary of the game — what happened and why the result occurred",
  "phases": [
    {
      "phase": "opening" | "middlegame" | "endgame",
      "assessment": "good" | "okay" | "poor",
      "moves": "e.g. moves 1-12",
      "explanation": "2-3 sentences about what happened in this phase",
      "key_moment": "The specific move or position that was most critical, e.g. '12. Nf3?! was inaccurate because...'",
      "suggestion": "What the player should have done differently"
    }
  ],
  "critical_mistakes": [
    {
      "move": "e.g. 15. Bxf7+",
      "why_bad": "Short explanation of why this was a mistake",
      "better_move": "What would have been better and why"
    }
  ],
  "things_done_well": [
    {
      "description": "What the player did well",
      "move_range": "e.g. moves 5-10"
    }
  ],
  "practice_recommendations": [
    {
      "theme": "valid Lichess training theme slug (e.g. endgame, fork, pin, discoveredAttack, mateIn2, backRankMate, kingsideAttack, advancedPawn, trappedPiece, hangingPiece, deflection, sacrifice, skewer, quietMove, xRayAttack, exposedKing)",
      "label": "Human readable label",
      "reason": "Why practicing this would help based on this specific game",
      "priority": "high" | "medium" | "low"
    }
  ],
  "opening_name": "Name of the opening played, if identifiable"
}

Provide 2-3 phases, 1-3 critical mistakes (or empty array if none), 1-3 things done well, and 3-5 practice recommendations. Be specific about move numbers and positions. ${engineAnalysis ? "Base your critical_mistakes on the engine-identified blunders and mistakes above." : ""}`;

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

    let analysis;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      analysis = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse game analysis" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-game error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
