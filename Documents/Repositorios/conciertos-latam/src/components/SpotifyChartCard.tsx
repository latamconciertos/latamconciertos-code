import { ExternalLink } from "lucide-react";
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
      className="group flex-shrink-0 w-[280px] p-4 rounded-xl bg-card hover:bg-card/80 transition-all duration-300 border border-border/50 hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        {/* Position */}
        <div className="flex-shrink-0 w-10 text-center">
          <span className="text-3xl font-bold text-foreground/60 group-hover:text-primary transition-colors">
            {item.position}
          </span>
        </div>

        {/* Image */}
        <div className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-muted shadow-md">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        </div>
      </div>

      {/* Info */}
      <div className="mt-3">
        <h3 className="font-bold text-foreground text-base line-clamp-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
          {subtitle || (isTrack ? "Canción" : "Artista")}
        </p>
      </div>
    </a>
  );
};
