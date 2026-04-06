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
    : artist?.images[0]?.url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop";

  const title = isTrack ? track?.name : artist?.name;
  const subtitle = isTrack ? track?.artists.map(a => a.name).join(", ") : artist?.genres?.slice(0, 2).join(", ");
  const spotifyUrl = item.external_urls.spotify;

  return (
    <a
      href={spotifyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 w-[160px] sm:w-[180px]"
    >
      {/* Image */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2.5 shadow-sm">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-[#1DB954] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="h-5 w-5 text-white ml-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Position */}
        <div className="absolute top-2 left-2 min-w-[24px] h-6 px-1.5 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-xs font-bold text-white">#{item.position}</span>
        </div>
      </div>

      {/* Info */}
      <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
        {subtitle || (isTrack ? "Canción" : "Artista")}
      </p>
    </a>
  );
};
