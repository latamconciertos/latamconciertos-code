import { User, MapPin } from 'lucide-react';

interface ProfileHeaderProps {
  displayName: string;
  username: string | null;
  location: string | null;
  stats: {
    concerts: number;
    artists: number;
    friends: number;
  };
}

const ProfileHeader = ({ displayName, username, location, stats }: ProfileHeaderProps) => {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Avatar */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary/20 via-primary/30 to-primary/50 flex items-center justify-center mb-4 ring-4 ring-primary/20">
        <User className="h-12 w-12 sm:h-14 sm:w-14 text-primary" />
      </div>
      
      {/* Name & Username */}
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">{displayName}</h1>
      {username && (
        <p className="text-sm text-muted-foreground mt-0.5">@{username}</p>
      )}
      
      {/* Location */}
      {location && (
        <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="flex items-center gap-8 mt-6 py-4 border-y border-border w-full justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.concerts}</p>
          <p className="text-xs text-muted-foreground">Conciertos</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.artists}</p>
          <p className="text-xs text-muted-foreground">Artistas</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-foreground">{stats.friends}</p>
          <p className="text-xs text-muted-foreground">Amigos</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
