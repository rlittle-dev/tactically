import { ChessProfile } from "@/lib/chess-api";
import { User, Globe, Calendar } from "lucide-react";

interface Props {
  profile: ChessProfile;
}

const ProfileHeader = ({ profile }: Props) => {
  const joined = new Date(profile.joined * 1000).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex items-center gap-5 opacity-0 animate-fade-in mb-8">
      <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden glow-primary">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
        ) : (
          <User className="h-8 w-8 text-primary" />
        )}
      </div>
      <div>
        <h2 className="text-2xl font-display italic font-semibold text-foreground">{profile.username}</h2>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          {profile.name && <span>{profile.name}</span>}
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Joined {joined}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5" /> {profile.followers} followers
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
