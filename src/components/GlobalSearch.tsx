import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Search, Mic2, Music2, BookOpen, Users, X, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from "@/lib/timezone";
import { Button } from "./ui/button";
import { friendService } from "@/services/friendService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SearchTab = "all" | "artists" | "concerts" | "news" | "people";

interface SearchResults {
  artists: Array<{
    id: string;
    name: string;
    slug: string;
    photo_url?: string | null;
  }>;
  concerts: Array<{
    id: string;
    title: string;
    slug: string;
    date: string | null;
    venue_name?: string;
    artist_name?: string;
    image_url?: string | null;
  }>;
  news: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string | null;
    cover_image?: string | null;
  }>;
  people: Array<{
    id: string;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    country_name?: string | null;
  }>;
}

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TABS: { key: SearchTab; label: string; icon: typeof Search }[] = [
  { key: "all", label: "Todo", icon: Search },
  { key: "artists", label: "Artistas", icon: Mic2 },
  { key: "concerts", label: "Conciertos", icon: Music2 },
  { key: "news", label: "Noticias", icon: BookOpen },
  { key: "people", label: "Personas", icon: Users },
];

const emptyResults: SearchResults = { artists: [], concerts: [], news: [], people: [] };

export const GlobalSearch = ({ open, onOpenChange }: GlobalSearchProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sendingRequest, setSendingRequest] = useState<string | null>(null);
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
    // Lock body scroll
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Search
  useEffect(() => {
    const ac = new AbortController();

    const run = async () => {
      if (searchQuery.length < 2) { setResults(emptyResults); return; }
      setIsLoading(true);
      const term = `%${searchQuery}%`;
      const should = (t: SearchTab) => activeTab === "all" || activeTab === t;

      try {
        const [a, c, n, p] = await Promise.all([
          should("artists")
            ? supabase.from("artists").select("id, name, slug, photo_url").ilike("name", term).abortSignal(ac.signal).limit(5)
            : { data: null },
          should("concerts")
            ? supabase.from("concerts").select("id, title, slug, date, image_url, venues(name), artists(name)").or(`title.ilike.${term}`).abortSignal(ac.signal).order("date", { ascending: true }).limit(5)
            : { data: null },
          should("news")
            ? supabase.from("news_articles").select("id, title, slug, published_at, cover_image").eq("status", "published").ilike("title", term).abortSignal(ac.signal).order("published_at", { ascending: false }).limit(5)
            : { data: null },
          should("people") && currentUserId
            ? supabase.from("profiles").select("id, username, first_name, last_name, avatar_url, countries(name)").neq("id", currentUserId).or(`username.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`).abortSignal(ac.signal).limit(5)
            : { data: null },
        ]);

        setResults({
          artists: (a.data as any) || [],
          concerts: (c.data as any)?.map((x: any) => ({ id: x.id, title: x.title, slug: x.slug, date: x.date, image_url: x.image_url, venue_name: x.venues?.name, artist_name: x.artists?.name })) || [],
          news: (n.data as any) || [],
          people: (p.data as any)?.map((x: any) => ({ id: x.id, username: x.username, first_name: x.first_name, last_name: x.last_name, avatar_url: x.avatar_url, country_name: x.countries?.name })) || [],
        });
      } catch (e: any) {
        if (e.name !== "AbortError") console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    const t = setTimeout(run, 300);
    return () => { clearTimeout(t); ac.abort(); };
  }, [searchQuery, activeTab, currentUserId]);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    setActiveTab("all");
    setResults(emptyResults);
    setSentRequests(new Set());
    onOpenChange(false);
  }, [onOpenChange]);

  const goTo = (path: string) => { handleClose(); navigate(path); };

  const handleAddFriend = async (id: string) => {
    if (!currentUserId) return;
    setSendingRequest(id);
    try {
      await friendService.sendFriendRequest(currentUserId, id);
      setSentRequests(prev => new Set(prev).add(id));
      toast.success("Solicitud enviada");
    } catch (e: any) {
      toast.error(e.code === "23505" ? "Ya existe una solicitud" : "Error al enviar solicitud");
    } finally {
      setSendingRequest(null);
    }
  };

  if (!open) return null;

  const total = results.artists.length + results.concerts.length + results.news.length + results.people.length;
  const hasQuery = searchQuery.length >= 2;

  const content = (
    <div
      className="fixed inset-0 bg-background"
      style={{ zIndex: 9999 }}
    >
      <div className="h-full flex flex-col max-w-2xl mx-auto">
        {/* ── Header ── */}
        <div className="flex-shrink-0 px-4 pt-[env(safe-area-inset-top,0px)]">
          {/* Search bar */}
          <div className="flex items-center gap-3 h-16">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-muted text-sm border-0 outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button onClick={handleClose} className="text-sm font-medium text-primary flex-shrink-0">
              Cancelar
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 pb-3 overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                    active ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="border-b border-border" />
        </div>

        {/* ── Results ── */}
        <div className="flex-1 overflow-y-auto px-4">
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && !hasQuery && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Busca artistas, conciertos, noticias o personas</p>
            </div>
          )}

          {!isLoading && hasQuery && total === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">Sin resultados para "<span className="text-foreground font-medium">{searchQuery}</span>"</p>
            </div>
          )}

          {/* Artists */}
          {results.artists.length > 0 && (
            <Section title="Artistas" color="text-violet-600 dark:text-violet-400">
              {results.artists.map(a => (
                <ResultRow key={a.id} onClick={() => goTo(`/artists/${a.slug}`)}>
                  <Thumbnail src={a.photo_url} fallback={<Mic2 className="h-5 w-5 text-violet-500" />} fallbackBg="bg-violet-500/10" round />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.name}</p>
                    <p className="text-xs text-muted-foreground">Artista</p>
                  </div>
                </ResultRow>
              ))}
            </Section>
          )}

          {/* Concerts */}
          {results.concerts.length > 0 && (
            <Section title="Conciertos" color="text-primary">
              {results.concerts.map(c => (
                <ResultRow key={c.id} onClick={() => goTo(`/concerts/${c.slug}`)}>
                  <Thumbnail src={c.image_url} fallback={<Music2 className="h-5 w-5 text-primary" />} fallbackBg="bg-primary/10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[c.artist_name, c.venue_name, c.date ? formatDisplayDate(c.date) : null].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </ResultRow>
              ))}
            </Section>
          )}

          {/* News */}
          {results.news.length > 0 && (
            <Section title="Noticias" color="text-amber-600 dark:text-amber-400">
              {results.news.map(n => (
                <ResultRow key={n.id} onClick={() => goTo(`/blog/${n.slug}`)}>
                  <Thumbnail src={n.cover_image} fallback={<BookOpen className="h-5 w-5 text-amber-500" />} fallbackBg="bg-amber-500/10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground line-clamp-1">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.published_at ? formatDisplayDate(n.published_at) : ""}</p>
                  </div>
                </ResultRow>
              ))}
            </Section>
          )}

          {/* People */}
          {results.people.length > 0 && (
            <Section title="Personas" color="text-emerald-600 dark:text-emerald-400">
              {results.people.map(p => {
                const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || "Usuario";
                const sent = sentRequests.has(p.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2.5 px-1 rounded-xl hover:bg-muted/50 transition-colors">
                    <button onClick={() => goTo(`/profile/${p.username || p.id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <Thumbnail src={p.avatar_url} fallback={<Users className="h-5 w-5 text-emerald-500" />} fallbackBg="bg-emerald-500/10" round />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {p.username ? `@${p.username}` : ""}{p.country_name ? ` · ${p.country_name}` : ""}
                        </p>
                      </div>
                    </button>
                    {currentUserId && (
                      <Button
                        variant={sent ? "secondary" : "default"}
                        size="sm"
                        className="h-8 rounded-lg text-xs gap-1.5 flex-shrink-0"
                        disabled={sendingRequest === p.id || sent}
                        onClick={() => handleAddFriend(p.id)}
                      >
                        {sendingRequest === p.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        {sent ? "Enviada" : "Agregar"}
                      </Button>
                    )}
                  </div>
                );
              })}
            </Section>
          )}

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

/* ── Subcomponents ── */

function Section({ title, color, children }: { title: string; color?: string; children: React.ReactNode }) {
  return (
    <div className="py-3">
      <p className={cn("text-[11px] font-semibold uppercase tracking-widest mb-1 px-1", color || "text-muted-foreground")}>{title}</p>
      <div>{children}</div>
    </div>
  );
}

function ResultRow({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 w-full py-2.5 px-1 rounded-xl hover:bg-muted/50 transition-colors text-left">
      {children}
    </button>
  );
}

function Thumbnail({ src, fallback, fallbackBg, round }: { src?: string | null; fallback: React.ReactNode; fallbackBg?: string; round?: boolean }) {
  const shape = round ? "rounded-full" : "rounded-lg";
  if (src) {
    return <img src={src} alt="" className={cn("h-11 w-11 object-cover flex-shrink-0", shape)} />;
  }
  return <div className={cn("h-11 w-11 flex items-center justify-center flex-shrink-0", shape, fallbackBg || "bg-primary/10")}>{fallback}</div>;
}
