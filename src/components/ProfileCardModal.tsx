import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Clock, Zap, Gauge, Trophy, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { ChessProfile, ChessStats, fetchProfile, fetchStats } from "@/lib/chess-api";
import { useShareAsImage, ShareButtons } from "@/hooks/use-share-image";

interface Props {
  username: string;
  onClose: () => void;
}

const ProfileCardModal = ({ username, onClose }: Props) => {
  const [profile, setProfile] = useState<ChessProfile | null>(null);
  const [stats, setStats] = useState<ChessStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { captureRef, downloadImage, copyShareLink } = useShareAsImage();

  useState(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([fetchProfile(username), fetchStats(username)]);
        setProfile(p);
        setStats(s);
      } catch (e: any) {
        setError(e.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    load();
  });

  const ratingData = stats ? [
    { label: "Rapid", icon: <Clock className="h-4 w-4" />, stats: stats.chess_rapid },
    { label: "Blitz", icon: <Zap className="h-4 w-4" />, stats: stats.chess_blitz },
    { label: "Bullet", icon: <Gauge className="h-4 w-4" />, stats: stats.chess_bullet },
  ].filter(r => r.stats) : [];

  const totalWins = ratingData.reduce((a, r) => a + (r.stats?.record.win || 0), 0);
  const totalLosses = ratingData.reduce((a, r) => a + (r.stats?.record.loss || 0), 0);
  const totalDraws = ratingData.reduce((a, r) => a + (r.stats?.record.draw || 0), 0);
  const totalGames = totalWins + totalLosses + totalDraws;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md"
        >
          {/* Action bar */}
          <div className="flex items-center justify-between mb-3">
            <ShareButtons
              onDownload={() => downloadImage(`tactically-${username}`)}
              onShare={() => copyShareLink(`/player/${username}`)}
            />
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* The card itself (captured for sharing) */}
          <div ref={captureRef} className="bg-card border border-border rounded-xl overflow-hidden">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground font-display italic">Loading profile...</p>
              </div>
            )}

            {error && (
              <div className="text-center text-destructive bg-destructive/10 p-6">{error}</div>
            )}

            {profile && stats && (
              <div className="p-6 space-y-5">
                {/* Player info */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" crossOrigin="anonymous" />
                    ) : (
                      <User className="h-8 w-8 text-foreground/60" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-display italic font-light text-foreground">{profile.username}</h2>
                    {profile.name && <p className="text-xs text-muted-foreground">{profile.name}</p>}
                  </div>
                </div>

                {/* Ratings */}
                <div className="grid grid-cols-3 gap-3">
                  {ratingData.map(r => {
                    const winRate = r.stats ? ((r.stats.record.win / (r.stats.record.win + r.stats.record.loss + r.stats.record.draw)) * 100).toFixed(0) : "0";
                    return (
                      <div key={r.label} className="bg-background/50 border border-border/60 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                          {r.icon}
                          <span className="text-xs uppercase tracking-wider">{r.label}</span>
                        </div>
                        <p className="text-2xl font-display italic text-foreground">{r.stats?.last.rating}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Trophy className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{r.stats?.best.rating}</span>
                        </div>
                        <p className="text-xs text-success mt-1">{winRate}% WR</p>
                      </div>
                    );
                  })}
                </div>

                {/* Overall Record */}
                <div className="bg-background/50 border border-border/60 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Overall Record</span>
                    <span className="text-xs text-muted-foreground">{totalGames.toLocaleString()} games</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1.5 text-success">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {totalWins.toLocaleString()} W
                    </span>
                    <span className="flex items-center gap-1.5 text-destructive">
                      <TrendingDown className="h-3.5 w-3.5" />
                      {totalLosses.toLocaleString()} L
                    </span>
                    <span className="text-muted-foreground">{totalDraws.toLocaleString()} D</span>
                  </div>
                  {totalGames > 0 && (
                    <div className="h-2 rounded-full bg-muted overflow-hidden flex mt-3">
                      <div className="h-full bg-success" style={{ width: `${(totalWins / totalGames) * 100}%` }} />
                      <div className="h-full bg-muted-foreground/30" style={{ width: `${(totalDraws / totalGames) * 100}%` }} />
                      <div className="h-full bg-destructive" style={{ width: `${(totalLosses / totalGames) * 100}%` }} />
                    </div>
                  )}
                </div>

                {/* Puzzle stats */}
                {(stats.tactics?.highest || stats.puzzle_rush?.best) && (
                  <div className="flex gap-3">
                    {stats.tactics?.highest && (
                      <div className="flex-1 bg-background/50 border border-border/60 rounded-lg p-3 text-center">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">Puzzle</span>
                        <p className="text-xl font-display italic text-foreground">{stats.tactics.highest.rating}</p>
                      </div>
                    )}
                    {stats.puzzle_rush?.best && (
                      <div className="flex-1 bg-background/50 border border-border/60 rounded-lg p-3 text-center">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground">Rush</span>
                        <p className="text-xl font-display italic text-foreground">{stats.puzzle_rush.best.score}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Branding */}
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/40">
                  <span className="text-foreground/60 text-sm">♞</span>
                  <span className="text-xs font-display italic text-muted-foreground tracking-wide">tactically.me</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfileCardModal;
