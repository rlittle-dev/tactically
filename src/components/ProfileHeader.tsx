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
      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center gap-5 mb-6"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
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
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-3xl font-display italic font-light text-foreground"
        >
          {profile.username}
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
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
