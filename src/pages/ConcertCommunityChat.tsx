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
// Paleta azul-verde de la marca: nada de violetas/morados (Evolución Nocturna)
const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-sky-500', 'bg-teal-500', 'bg-orange-500', 'bg-lime-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getNameColor = (name: string) => {
  const colors = [
    'text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400',
    'text-cyan-400', 'text-sky-400', 'text-teal-400', 'text-orange-400', 'text-lime-400',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Check if two dates are different days
const isDifferentDay = (d1: string, d2: string) => {
  return new Date(d1).toDateString() !== new Date(d2).toDateString();
};

// Fecha-only sin hora: anclar a mediodía para evitar el corrimiento de zona horaria (UTC-5)
const parseEventDate = (d: string) => new Date(d.includes('T') ? d : `${d}T12:00:00`);

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
  // Solo los mensajes que llegan después de la carga inicial se animan al entrar
  const initialCountRef = useRef<number | null>(null);

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
          const { data: profile } = await supabase.from('profiles_search').select('username, first_name, last_name').eq('id', msg.user_id).maybeSingle();
          return { ...msg, sender: profile || { username: null, first_name: null, last_name: null } };
        })
      );
      setMessages(withProfiles as any);
      if (initialCountRef.current === null) initialCountRef.current = withProfiles.length;
    }
  };

  const loadMembers = async (cid: string) => {
    const { data } = await supabase
      .from('community_members')
      .select('id, user_id')
      .eq('community_id', cid);

    if (data) {
      // El embed PostgREST no funciona sobre la vista profiles_search,
      // así que resolvemos los perfiles en una segunda consulta.
      const ids = data.map(m => m.user_id);
      const { data: profs } = await supabase
        .from('profiles_search')
        .select('id, username, first_name, last_name')
        .in('id', ids);
      const byId = new Map((profs || []).map(p => [p.id, p]));

      setMembers(data.map(m => {
        const p = byId.get(m.user_id) as any;
        return {
          id: m.id, user_id: m.user_id,
          username: p?.username || null,
          first_name: p?.first_name || null,
          last_name: p?.last_name || null,
        };
      }));
    }
  };

  const subscribeToMessages = (cid: string) => {
    const channel = supabase.channel(`community-messages-${cid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_messages', filter: `community_id=eq.${cid}` },
        async (payload) => {
          const { data: profileData } = await supabase.from('profiles_search').select('username, first_name, last_name').eq('id', payload.new.user_id).maybeSingle();
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
      <div className="h-[100dvh] flex flex-col bg-noche">
        <div className="h-14 shrink-0 border-b border-linea bg-noche/80 backdrop-blur-lg" />
        <div className="flex-1 px-4 py-6">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
            {[
              { own: false, w: 'w-52' }, { own: false, w: 'w-36' }, { own: true, w: 'w-44' },
              { own: false, w: 'w-60' }, { own: true, w: 'w-32' }, { own: false, w: 'w-40' },
            ].map((b, i) => (
              <div key={i} className={`flex ${b.own ? 'justify-end' : 'justify-start'}`}>
                <div className={`h-9 ${b.w} animate-pulse rounded-2xl ${b.own ? 'bg-superficie-2' : 'bg-superficie'}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-noche">
      {/* ── Header ── */}
      <header className="bg-noche/80 backdrop-blur-lg border-b border-linea text-texto shrink-0 safe-area-top">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center gap-1 px-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate(`/concerts/${concertId}`)}
            className="text-texto-2 hover:text-texto hover:bg-superficie-2 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
            <SheetTrigger asChild>
              <button className="flex items-center gap-3 flex-1 min-w-0 text-left rounded-lg px-2 py-1.5 hover:bg-superficie-2 transition-colors">
                {concertInfo.image_url ? (
                  <img src={concertInfo.image_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-linea" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-superficie-2 flex items-center justify-center shrink-0 ring-1 ring-linea">
                    <Music className="h-5 w-5 text-periwinkle" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="font-semibold text-sm truncate text-texto">{concertInfo.title}</h1>
                  <p className="text-[11px] text-texto-2 truncate">
                    {concertInfo.artist_name ? `${concertInfo.artist_name} · ` : ''}
                    {members.length} fan{members.length !== 1 ? 's' : ''} en la comunidad
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-texto-2 shrink-0" />
              </button>
            </SheetTrigger>

            {/* ── Group Info Sheet ── */}
            <SheetContent side="right" className="w-full sm:max-w-sm p-0">
              <div className="flex flex-col h-full">
                {/* Cover */}
                <div className="relative h-44 bg-superficie">
                  {concertInfo.image_url ? (
                    <img src={concertInfo.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-12 w-12 text-texto-2/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-noche to-transparent" />
                  {concertInfo.date && (
                    <div className="absolute right-3 top-3 rounded-2xl bg-noche/85 px-3 py-1.5 text-center">
                      <p className="font-display text-2xl font-extrabold leading-none text-verde">
                        {format(parseEventDate(concertInfo.date), 'd')}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-texto-2">
                        {format(parseEventDate(concertInfo.date), 'MMM', { locale: es })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="px-5 -mt-6 relative z-10">
                  {concertInfo.artist_name && (
                    <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-periwinkle">
                      {concertInfo.artist_name}
                    </p>
                  )}
                  <h2 className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-texto">
                    {concertInfo.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-xs text-texto-2">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {members.length} fan{members.length !== 1 ? 's' : ''}
                    </span>
                    {concertInfo.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseEventDate(concertInfo.date), "d MMM yyyy", { locale: es })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Members */}
                <div className="mt-5 flex-1 overflow-hidden">
                  <p className="mb-2 flex items-center gap-2 px-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-azul-claro">
                    <span className="h-0.5 w-6 rounded-full bg-verde" aria-hidden />
                    Fans en la comunidad
                  </p>
                  <ScrollArea className="h-full">
                    <div className="px-5 pb-6 space-y-0.5">
                      {members.map((m) => {
                        const name = getName(m);
                        return (
                          <div key={m.id} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-superficie-2/60 transition-colors">
                            <div className={`w-9 h-9 rounded-full ${getAvatarColor(name)} flex items-center justify-center shrink-0`}>
                              <span className="text-xs font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                            </div>
                            <p className="text-sm font-medium truncate flex-1 text-texto">
                              {name}
                              {m.user_id === currentUserId && <span className="text-xs text-texto-2 ml-1">(tú)</span>}
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
      <div className="relative flex-1 overflow-hidden">
        {/* Ambiente nocturno: glow de cobalto + arcos del isotipo como luz de escenario */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-28 left-1/2 h-72 w-[42rem] max-w-[130%] -translate-x-1/2 rounded-full bg-cobalto opacity-25 blur-[120px]" />
          <svg
            className="absolute inset-x-0 bottom-0 mx-auto h-auto w-full min-w-[760px]"
            viewBox="0 0 1200 300"
            fill="none"
            preserveAspectRatio="xMidYMax slice"
          >
            <path d="M-60 300C260 60 940 60 1260 300" stroke="#E70485" strokeOpacity="0.16" strokeWidth="2" />
            <path d="M40 300C320 120 880 120 1160 300" stroke="#E70485" strokeOpacity="0.11" strokeWidth="2" />
            <path d="M140 300C390 175 810 175 1060 300" stroke="#FE670C" strokeOpacity="0.13" strokeWidth="2" />
          </svg>
        </div>

        <ScrollArea className="h-full">
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-end px-3 py-3 sm:px-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {concertInfo.image_url ? (
                  <img
                    src={concertInfo.image_url}
                    alt=""
                    className="mb-5 h-20 w-20 rounded-full object-cover ring-2 ring-periwinkle/35 shadow-[0_0_40px_rgba(117,22,226,.45)]"
                  />
                ) : (
                  <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-superficie-2 ring-2 ring-periwinkle/35">
                    <Music className="h-9 w-9 text-periwinkle" />
                  </div>
                )}
                <p className="mb-2 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-azul-claro">
                  <span className="h-0.5 w-6 rounded-full bg-verde" aria-hidden />
                  Comunidad
                  <span className="h-0.5 w-6 rounded-full bg-verde" aria-hidden />
                </p>
                <p className="font-display text-2xl font-extrabold uppercase tracking-[0.01em] text-texto">
                  El chat de este show
                </p>
                <p className="mt-2 max-w-[260px] text-sm text-texto-2">
                  Habla con otros fans que van a este concierto. Rompe el hielo — sé quien escriba primero.
                </p>
                {concertInfo.date && (
                  <div className="mt-5 inline-flex items-center gap-2.5 rounded-full border border-verde/30 bg-verde/10 px-4 py-2">
                    <span className="font-display text-2xl font-extrabold leading-none text-verde">
                      {format(parseEventDate(concertInfo.date), 'd')}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wide text-verde">
                      {format(parseEventDate(concertInfo.date), 'MMM yyyy', { locale: es })}
                    </span>
                  </div>
                )}
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
              const next = messages[i + 1];
              // La "cola" de la burbuja solo va en el último mensaje del grupo
              const isLastInGroup = !next || next.user_id !== msg.user_id ||
                isDifferentDay(msg.created_at, next.created_at) ||
                (new Date(next.created_at).getTime() - new Date(msg.created_at).getTime()) >= 120000;
              const isNew = initialCountRef.current !== null && i >= initialCountRef.current;

              return (
                <div key={msg.id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <div className="flex justify-center my-4">
                      <span className="rounded-full border border-linea bg-superficie px-3 py-1 text-[11px] font-medium text-texto-2">
                        {formatDateSeparator(msg.created_at)}
                      </span>
                    </div>
                  )}

                  <div
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-0.5' : 'mt-3'} ${
                      isNew ? 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300' : ''
                    }`}
                  >
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
                      className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-3 py-1.5 ${
                        isOwn
                          ? `bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_4px_16px_rgba(117,22,226,.3)] ${isLastInGroup ? 'rounded-br-md' : ''}`
                          : `bg-superficie border border-linea text-texto ${isLastInGroup ? 'rounded-bl-md' : ''}`
                      }`}
                    >
                      {showName && (
                        <p className={`text-[11px] font-semibold mb-0.5 ${getNameColor(senderName)}`}>
                          {senderName}
                        </p>
                      )}
                      <div className="flex items-end gap-2">
                        <p className="text-[14px] leading-[1.4] break-words whitespace-pre-wrap flex-1">{msg.message}</p>
                        <span className={`text-[10px] shrink-0 translate-y-0.5 ${isOwn ? 'text-white/60' : 'text-texto-2/70'}`}>
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
      <div className="bg-noche border-t border-linea px-3 py-2 safe-area-bottom shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="mx-auto flex w-full max-w-3xl items-end gap-2"
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
            className="flex-1 resize-none rounded-2xl bg-superficie border border-linea px-4 py-2.5 text-sm text-texto outline-none focus:ring-2 focus:ring-periwinkle placeholder:text-texto-2/50 max-h-[120px]"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !input.trim()}
            className="rounded-full shrink-0 h-10 w-10 border-0 bg-[linear-gradient(95deg,#7516E2,#E70485)] text-white shadow-[0_8px_32px_rgba(117,22,226,.45)] transition-transform hover:opacity-95 motion-safe:hover:-translate-y-0.5 disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
