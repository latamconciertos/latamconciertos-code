import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowLeft, Users, ChevronRight, Calendar, Music } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Message {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  sender: {
    username: string | null;
    first_name: string | null;
    last_name: string | null;
  };
}

interface Member {
  id: string;
  user_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface ConcertInfo {
  title: string;
  date: string | null;
  image_url: string | null;
  artist_name: string | null;
}

// Generate a consistent color from a string
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
    'bg-teal-500', 'bg-orange-500', 'bg-lime-500', 'bg-fuchsia-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getNameColor = (name: string) => {
  const colors = [
    'text-blue-400', 'text-emerald-400', 'text-violet-400', 'text-amber-400',
    'text-rose-400', 'text-cyan-400', 'text-pink-400', 'text-indigo-400',
    'text-teal-400', 'text-orange-400', 'text-lime-400', 'text-fuchsia-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Check if two dates are different days
const isDifferentDay = (d1: string, d2: string) => {
  return new Date(d1).toDateString() !== new Date(d2).toDateString();
};

const formatDateSeparator = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return format(date, "d 'de' MMMM, yyyy", { locale: es });
};

export default function ConcertCommunityChat() {
  const { concertId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [communityId, setCommunityId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [concertInfo, setConcertInfo] = useState<ConcertInfo>({ title: '', date: null, image_url: null, artist_name: null });
  const [infoOpen, setInfoOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messageSendTimestamps = useRef<number[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    let messageChannel: any;
    let memberChannel: any;

    const initializeCommunity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({ title: "Debes iniciar sesión", variant: "destructive" });
          navigate('/auth');
          return;
        }

        setCurrentUserId(session.user.id);

        const { data: concertData } = await supabase
          .from('concerts')
          .select('title, date, image_url, artists(name)')
          .eq('id', concertId!)
          .single();

        if (concertData) {
          setConcertInfo({
            title: concertData.title,
            date: concertData.date,
            image_url: concertData.image_url,
            artist_name: (concertData.artists as any)?.name || null,
          });
        }

        let { data: community } = await supabase
          .from('concert_communities')
          .select('id')
          .eq('concert_id', concertId!)
          .single();

        if (!community) {
          const { data: newCommunity, error: createError } = await supabase
            .from('concert_communities')
            .insert([{ concert_id: concertId!, name: `Comunidad ${concertData?.title || 'Concierto'}`, description: 'Chat de la comunidad' }])
            .select().single();
          if (createError) throw createError;
          community = newCommunity;
        }

        setCommunityId(community.id);

        const { data: membership } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', community.id)
          .eq('user_id', session.user.id)
          .single();

        if (!membership) {
          await supabase.from('community_members').insert([{ community_id: community.id, user_id: session.user.id }]);
        }

        await loadMessages(community.id);
        await loadMembers(community.id);
        messageChannel = subscribeToMessages(community.id);
        memberChannel = subscribeToMembers(community.id);
      } catch (error) {
        console.error('Error initializing community:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCommunity();
    return () => { messageChannel?.(); memberChannel?.(); };
  }, [concertId]);

  const loadMessages = async (cid: string) => {
    const { data } = await supabase
      .from('community_messages')
      .select('id, message, created_at, user_id')
      .eq('community_id', cid)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      const withProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: profile } = await supabase.from('profiles').select('username, first_name, last_name').eq('id', msg.user_id).single();
          return { ...msg, sender: profile || { username: null, first_name: null, last_name: null } };
        })
      );
      setMessages(withProfiles as any);
    }
  };

  const loadMembers = async (cid: string) => {
    const { data } = await supabase
      .from('community_members')
      .select('id, user_id, profiles:user_id(username, first_name, last_name)')
      .eq('community_id', cid);

    if (data) {
      setMembers(data.map(m => ({
        id: m.id, user_id: m.user_id,
        username: (m.profiles as any)?.username || null,
        first_name: (m.profiles as any)?.first_name || null,
        last_name: (m.profiles as any)?.last_name || null,
      })));
    }
  };

  const subscribeToMessages = (cid: string) => {
    const channel = supabase.channel(`community-messages-${cid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `community_id=eq.${cid}` },
        async (payload) => {
          const { data: profileData } = await supabase.from('profiles').select('username, first_name, last_name').eq('id', payload.new.user_id).single();
          const newMsg: Message = { id: payload.new.id, message: payload.new.message, created_at: payload.new.created_at, user_id: payload.new.user_id, sender: profileData || { username: null, first_name: null, last_name: null } };
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const subscribeToMembers = (cid: string) => {
    const channel = supabase.channel(`community-members-${cid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members', filter: `community_id=eq.${cid}` }, () => { loadMembers(cid); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const sendMessage = async () => {
    if (!input.trim() || !communityId || !currentUserId) return;
    const now = Date.now();
    messageSendTimestamps.current = messageSendTimestamps.current.filter(t => t > now - 60000);
    if (messageSendTimestamps.current.length >= 15) {
      toast({ title: "Espera un momento", description: "Demasiados mensajes, intenta en unos segundos.", variant: "destructive" });
      return;
    }
    messageSendTimestamps.current.push(now);

    setIsSending(true);
    const text = input.trim();
    setInput('');

    const tempId = `opt-${Date.now()}`;
    const optimistic: Message = { id: tempId, message: text, created_at: new Date().toISOString(), user_id: currentUserId, sender: { username: null, first_name: null, last_name: null } };
    setMessages(prev => [...prev, optimistic]);

    try {
      const { data: inserted, error } = await supabase
        .from('community_messages')
        .insert([{ community_id: communityId, user_id: currentUserId, message: text }])
        .select('id, message, created_at, user_id').single();
      if (error) throw error;
      if (inserted) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...inserted, sender: optimistic.sender } as Message : m));
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(text);
      toast({ title: "Error", description: "No se pudo enviar el mensaje", variant: "destructive" });
    } finally {
      setIsSending(false);
      // Reset textarea height
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  };

  const getName = (s: { username: string | null; first_name: string | null; last_name: string | null }) => {
    if (s.first_name) return `${s.first_name} ${s.last_name || ''}`.trim();
    if (s.username) return s.username;
    return 'Usuario';
  };

  const formatTime = (d: string) => new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col bg-background">
        <div className="h-14 bg-primary/95 backdrop-blur-lg" />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando chat...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="bg-primary/95 backdrop-blur-lg text-primary-foreground shrink-0 safe-area-top">
        <div className="flex items-center gap-1 h-14 px-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`/concerts/${concertId}`)}
            className="text-primary-foreground hover:bg-white/10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors">
                {concertInfo.image_url ? (
                  <img src={concertInfo.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                    <Music className="h-5 w-5 text-white/70" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold text-sm truncate">{concertInfo.title}</h1>
                  <p className="text-[11px] text-white/60 truncate">
                    {members.length} miembro{members.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
              </button>
            </SheetTrigger>

            {/* ── Group Info Sheet ── */}
            <SheetContent side="right" className="w-full sm:max-w-sm p-0">
              <div className="flex flex-col h-full">
                {/* Cover */}
                <div className="relative h-44 bg-muted">
                  {concertInfo.image_url ? (
                    <img src={concertInfo.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>

                <div className="px-5 -mt-6 relative z-10">
                  <h2 className="text-lg font-bold">{concertInfo.title}</h2>
                  {concertInfo.artist_name && (
                    <p className="text-sm text-primary font-medium">{concertInfo.artist_name}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {members.length} miembros
                    </span>
                    {concertInfo.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(concertInfo.date), "d MMM yyyy", { locale: es })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div className="mt-5 flex-1 overflow-hidden">
                  <p className="px-5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Miembros
                  </p>
                  <ScrollArea className="h-full">
                    <div className="px-5 pb-6 space-y-0.5">
                      {members.map((m) => {
                        const name = getName(m);
                        return (
                          <div key={m.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className={`w-9 h-9 rounded-full ${getAvatarColor(name)} flex items-center justify-center shrink-0`}>
                              <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                            </div>
                            <p className="text-sm font-medium truncate flex-1">
                              {name}
                              {m.user_id === currentUserId && <span className="text-xs text-muted-foreground ml-1">(tú)</span>}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-3 sm:px-4 py-3 min-h-full flex flex-col justify-end">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Music className="h-8 w-8 text-primary/50" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Chat de la comunidad</p>
                <p className="text-xs text-muted-foreground max-w-[240px]">
                  Habla con otros fans que van a este concierto
                </p>
              </div>
            )}

            {messages.map((msg, i) => {
              const isOwn = msg.user_id === currentUserId;
              const senderName = getName(msg.sender);
              const showDateSep = i === 0 || isDifferentDay(messages[i - 1].created_at, msg.created_at);
              // Show sender name if: not own, and (first msg or different sender or different day from prev)
              const showName = !isOwn && (i === 0 || messages[i - 1].user_id !== msg.user_id || showDateSep);
              // Group with previous: same sender, same day, within 2 min
              const isGrouped = i > 0 && messages[i - 1].user_id === msg.user_id && !showDateSep &&
                (new Date(msg.created_at).getTime() - new Date(messages[i - 1].created_at).getTime()) < 120000;

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-3'}`}>
                    {/* Avatar for others */}
                    {!isOwn && (
                      <div className="w-8 mr-1.5 flex-shrink-0 flex items-end">
                        {showName ? (
                          <div className={`w-7 h-7 rounded-full ${getAvatarColor(senderName)} flex items-center justify-center`}>
                            <span className="text-[10px] font-bold text-white">{senderName.charAt(0).toUpperCase()}</span>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* Bubble */}
                    <div
                      className={`max-w-[78%] sm:max-w-[65%] px-3 py-1.5 ${
                        isOwn
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                          : 'bg-card border border-border/50 text-card-foreground rounded-2xl rounded-bl-md'
                      }`}
                    >
                      {showName && (
                        <p className={`text-[11px] font-semibold mb-0.5 ${getNameColor(senderName)}`}>
                          {senderName}
                        </p>
                      )}
                      <div className="flex items-end gap-2">
                        <p className="text-[14px] leading-[1.4] break-words whitespace-pre-wrap flex-1">{msg.message}</p>
                        <span className={`text-[10px] shrink-0 translate-y-0.5 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/70'}`}>
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* ── Input ── */}
      <div className="bg-background border-t border-border px-3 py-2 safe-area-bottom shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-end gap-2"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Mensaje"
            disabled={isSending}
            rows={1}
            className="flex-1 resize-none rounded-2xl bg-muted border-0 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 max-h-[120px]"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !input.trim()}
            className="rounded-full shrink-0 h-10 w-10"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
