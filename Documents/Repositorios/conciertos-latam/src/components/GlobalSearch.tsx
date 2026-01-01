import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Search, Music2, Mic2, BookOpen, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { formatDisplayDate } from "@/lib/timezone";

interface SearchResults {
  artists: Array<{
    id: string;
    name: string;
    slug: string;
    photo_url?: string;
  }>;
  concerts: Array<{
    id: string;
    title: string;
    slug: string;
    date: string;
    venue_name?: string;
    artist_name?: string;
  }>;
  news: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string;
  }>;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    artists: [],
    concerts: [],
    news: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.length < 2) {
        setResults({ artists: [], concerts: [], news: [] });
        return;
      }

      setIsLoading(true);

      try {
        const searchTerm = `%${searchQuery}%`;

        // Search artists
        const { data: artistsData } = await supabase
          .from("artists")
          .select("id, name, slug, photo_url")
          .ilike("name", searchTerm)
          .limit(5);

        // Search concerts with artist and venue info
        const { data: concertsData } = await supabase
          .from("concerts")
          .select(`
            id,
            title,
            slug,
            date,
            venues(name),
            artists(name)
          `)
          .or(`title.ilike.${searchTerm}`)
          .order("date", { ascending: true })
          .limit(5);

        // Search news
        const { data: newsData } = await supabase
          .from("news_articles")
          .select("id, title, slug, published_at")
          .eq("status", "published")
          .ilike("title", searchTerm)
          .order("published_at", { ascending: false })
          .limit(5);

        setResults({
          artists: artistsData || [],
          concerts: concertsData?.map(c => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            date: c.date,
            venue_name: c.venues?.name,
            artist_name: c.artists?.name,
          })) || [],
          news: newsData || [],
        });
      } catch (error) {
        console.error("Error searching:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleClose = () => {
    setSearchQuery("");
    setResults({ artists: [], concerts: [], news: [] });
    onOpenChange(false);
  };

  const totalResults = results.artists.length + results.concerts.length + results.news.length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Buscar en Conciertos LATAM</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar artistas, conciertos, noticias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Buscando...
            </div>
          )}

          {!isLoading && searchQuery.length >= 2 && totalResults === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron resultados para "{searchQuery}"
            </div>
          )}

          {!isLoading && searchQuery.length < 2 && (
            <div className="text-center py-8 text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}

          {/* Artists Results */}
          {results.artists.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Mic2 className="h-4 w-4" />
                Artistas ({results.artists.length})
              </h3>
              <div className="space-y-2">
                {results.artists.map((artist) => (
                  <Link
                    key={artist.id}
                    to={`/artists/${artist.slug}`}
                    onClick={handleClose}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    {artist.photo_url ? (
                      <img
                        src={artist.photo_url}
                        alt={artist.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Mic2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{artist.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Concerts Results */}
          {results.concerts.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <Music2 className="h-4 w-4" />
                Conciertos ({results.concerts.length})
              </h3>
              <div className="space-y-2">
                {results.concerts.map((concert) => (
                  <Link
                    key={concert.id}
                    to={`/concerts?id=${concert.slug}`}
                    onClick={handleClose}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{concert.title}</p>
                      <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        {concert.artist_name && <span>{concert.artist_name}</span>}
                        {concert.venue_name && <span>• {concert.venue_name}</span>}
                        <span>• {formatDisplayDate(concert.date)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* News Results */}
          {results.news.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <BookOpen className="h-4 w-4" />
                Noticias ({results.news.length})
              </h3>
              <div className="space-y-2">
                {results.news.map((article) => (
                  <Link
                    key={article.id}
                    to={`/blog/${article.slug}`}
                    onClick={handleClose}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">{article.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDisplayDate(article.published_at)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
