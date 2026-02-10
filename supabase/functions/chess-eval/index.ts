import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { positions } = await req.json();

    if (!Array.isArray(positions) || positions.length === 0) {
      return new Response(JSON.stringify({ error: "positions array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Evaluate each position sequentially with a small delay to respect rate limits
    const results = [];
    for (let i = 0; i < positions.length; i++) {
      const { fen, depth = 16 } = positions[i];

      let data = null;
      let lastError = "";

      // Retry up to 3 times with backoff
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const res = await fetch("https://chess-api.com/v1", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fen, depth, maxThinkingTime: 100 }),
          });

          const json = await res.json();

          if (json.type === "error") {
            lastError = json.text || json.error || "chess-api error";
            if (json.error === "HIGH_USAGE" && attempt < 2) {
              // Wait and retry
              await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)));
              continue;
            }
            break;
          }

          data = {
            eval: json.eval,
            winChance: json.winChance,
            move: json.move || null,
            san: json.san || null,
            depth: json.depth,
            mate: json.mate || null,
          };
          break;
        } catch (e) {
          lastError = e instanceof Error ? e.message : "fetch failed";
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
          }
        }
      }

      results.push(data || { error: lastError, fen });

      // Small delay between requests
      if (i < positions.length - 1) {
        await new Promise((r) => setTimeout(r, 150));
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chess-eval error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
