import { supabase } from "@/integrations/supabase/client";
import type { ChessStats, RecentGame } from "./chess-api";

export interface AIAnalysis {
  weaknesses: {
    category: string;
    title: string;
    description: string;
    severity: "high" | "medium" | "low";
    lichess_themes: string[];
  }[];
  strengths: {
    title: string;
    description: string;
  }[];
  overall_assessment: string;
  recommended_puzzles: {
    theme: string;
    label: string;
    reason: string;
  }[];
}

export async function fetchAIAnalysis(
  username: string,
  stats: ChessStats,
  games: RecentGame[]
): Promise<AIAnalysis> {
  const { data, error } = await supabase.functions.invoke("analyze-chess", {
    body: { username, stats, games },
  });

  if (error) {
    console.error("AI analysis error:", error);
    throw new Error(error.message || "AI analysis failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as AIAnalysis;
}
