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
    <div className="flex items-center gap-5 opacity-0 animate-fade-in mb-6">
      <div className="h-14 w-14 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
        {profile.avatar ? (
          <img src={profile.avatar} alt={profile.username} className="h-full w-full object-cover" />
        ) : (
          <User className="h-7 w-7 text-foreground/60" />
        )}
      </div>
      <div>
        <h2 className="text-3xl font-display italic font-light text-foreground">{profile.username}</h2>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 tracking-wide">
          {profile.name && <span>{profile.name}</span>}
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Joined {joined}
          </span>
          <span className="flex items-center gap-1">
            <Globe className="h-3 w-3" /> {profile.followers.toLocaleString()} followers
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
