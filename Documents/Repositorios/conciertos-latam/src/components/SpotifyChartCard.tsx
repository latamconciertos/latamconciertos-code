import { Play } from "lucide-react";
import type { ChartTrack, ChartArtist } from "@/types/spotify";

interface SpotifyChartCardProps {
  item: ChartTrack | ChartArtist;
  type: "track" | "artist";
}

export const SpotifyChartCard = ({ item, type }: SpotifyChartCardProps) => {
  const isTrack = type === "track";
  const track = isTrack ? (item as ChartTrack) : null;
  const artist = !isTrack ? (item as ChartArtist) : null;

  const imageUrl = isTrack
    ? track?.album.images[0]?.url
    : artist?.images[0]?.url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop";

  const title = isTrack ? track?.name : artist?.name;
  const subtitle = isTrack ? track?.artists.map(a => a.name).join(", ") : artist?.genres?.slice(0, 2).join(" • ");
  const spotifyUrl = item.external_urls.spotify;

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex-shrink-0 w-[220px]"
    >
      {/* Main Card Container with Glassmorphism */}
      <div className="relative h-[330px] flex flex-col rounded-2xl bg-gradient-to-br from-card/60 via-card/40 to-card/60 backdrop-blur-sm p-4 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2">

        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/10 group-hover:via-primary/5 group-hover:to-primary/10 transition-all duration-500" />

        {/* Position Badge - Top Right */}
        <div className="absolute -top-3 -right-3 z-20 w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/70 flex items-center justify-center shadow-lg ring-4 ring-background">
          <span className="text-base font-black text-primary-foreground">
            {item.position}
          </span>
        </div>

        {/* Image Container - Fixed size */}
        <div className="relative w-[188px] h-[188px] rounded-xl overflow-hidden mb-4 shadow-xl group-hover:shadow-2xl transition-shadow duration-300 flex-shrink-0">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />

          {/* Play button overlay - appears on hover */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Play className="h-6 w-6 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Gradient overlay bottom */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Info Section - Fixed height */}
        <div className="relative z-10 space-y-1.5 h-[42px] flex flex-col justify-start">
          <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-300 min-h-[2.5rem]">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
            {subtitle || (isTrack ? "Canción" : "Artista")}
          </p>
        </div>

        {/* Popularity bar indicator */}
        <div className="mt-3 h-1 bg-muted/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-700"
            style={{ width: `${item.popularity || 50}%` }}
          />
        </div>
      </div>
    </a>
  );
};
