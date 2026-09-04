import { User, MapPin } from 'lucide-react';

interface ProfileHeaderProps {
  displayName: string;
  username: string | null;
  location: string | null;
  bio: string | null;
  avatarUrl?: string | null;
  stats: {
    concerts: number;
    artists: number;
    friends: number;
  };
}

const ProfileHeader = ({ displayName, username, location, bio, avatarUrl, stats }: ProfileHeaderProps) => {
  return (
    <div className="space-y-3">
      {/* Top row: Avatar + Stats */}
      <div className="flex items-center gap-6 sm:gap-8">
        {/* Avatar con anillo de gradiente firma */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-[linear-gradient(135deg,#7516E2,#E70485)]">
            <div className="w-full h-full rounded-full bg-superficie-2 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 sm:h-12 sm:w-12 text-periwinkle" />
              )}
            </div>
          </div>
        </div>

        {/* Stats: números en Big Shoulders con verde de acento */}
        <div className="flex flex-1 justify-around">
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold text-verde leading-none">{stats.concerts}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Conciertos</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold text-verde leading-none">{stats.artists}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Artistas</p>
          </div>
          <div className="text-center">
            <p className="font-display text-2xl font-extrabold text-verde leading-none">{stats.friends}</p>
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">Amigos</p>
          </div>
        </div>
      </div>

      {/* Name, Username, Bio & Location */}
      <div className="space-y-0.5">
        <h1 className="text-sm sm:text-base font-bold text-foreground leading-tight">{displayName}</h1>
        {username && (
          <p className="text-sm text-muted-foreground">@{username}</p>
        )}
        {bio && (
          <p className="text-sm text-foreground pt-1">{bio}</p>
        )}
        {location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground pt-0.5">
            <MapPin className="h-3.5 w-3.5 text-periwinkle" />
            <span>{location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;
