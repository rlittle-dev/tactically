import { ChessProfile } from "@/lib/chess-api";
import { User, Globe, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  profile: ChessProfile;
}

const ProfileHeader = ({ profile }: Props) => {
  const joined = new Date(profile.joined * 1000).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-5 mb-6"
    >
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
        className="h-14 w-14 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden"
      >
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
        ) : (
          <User className="h-7 w-7 text-foreground/60" />
        )}
      </motion.div>
      <div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-3xl font-display italic font-light text-foreground"
        >
          {profile.username}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center gap-4 text-xs text-muted-foreground mt-1 tracking-wide"
        >
          {profile.name && <span>{profile.name}</span>}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Joined {joined}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" /> {profile.followers.toLocaleString()} followers
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
