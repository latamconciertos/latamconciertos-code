import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Send, ArrowLeft, Users, ChevronRight, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { rateLimit } from '@/utils/rateLimit';

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
}

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
  const [concertInfo, setConcertInfo] = useState<ConcertInfo>({ title: '', date: null, image_url: null });
  const [infoOpen, setInfoOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rate limiting: track message timestamps (15 messages per minute)
  const messageSendTimestamps = useRef<number[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    let messageChannel: any;
    let memberChannel: any;

    const initializeCommunity = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({
            title: "Debes iniciar sesión",
            description: "Inicia sesión para ver el chat de la comunidad",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        setCurrentUserId(session.user.id);

        // Get concert info
        const { data: concertData } = await supabase
          .from('concerts')
          .select('title, date, image_url')
          .eq('id', concertId)
          .single();

        if (concertData) {
          setConcertInfo({
            title: concertData.title,
            date: concertData.date,
            image_url: concertData.image_url
          });
        }

        // Get or create community
        let { data: community } = await supabase
          .from('concert_communities')
          .select('id')
          .eq('concert_id', concertId)
          .single();

        if (!community) {
          const { data: newCommunity, error: createError } = await supabase
            .from('concert_communities')
            .insert([{
              concert_id: concertId,
              name: `Comunidad ${concertData?.title || 'Concierto'}`,
              description: 'Chat de la comunidad'
            }])
            .select()
            .single();

          if (createError) throw createError;
          community = newCommunity;
        }

        setCommunityId(community.id);

        // Check membership
        const { data: membership } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', community.id)
          .eq('user_id', session.user.id)
          .single();

        if (!membership) {
          await supabase
            .from('community_members')
            .insert([{
              community_id: community.id,
              user_id: session.user.id
            }]);
        }

        // Load messages
        await loadMessages(community.id);
        // Load members
        await loadMembers(community.id);

        // Subscribe to new messages (with cleanup reference)
        messageChannel = subscribeToMessages(community.id);
        // Subscribe to member changes (with cleanup reference)
        memberChannel = subscribeToMembers(community.id);

      } catch (error) {
        console.error('Error initializing community:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCommunity();

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      if (messageChannel) {
        messageChannel();
      }
      if (memberChannel) {
        memberChannel();
      }
    };
  }, [concertId]);

  const loadMessages = async (communityId: string) => {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        id,
        message,
        created_at,
        user_id
      `)
      .eq('community_id', communityId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    if (data) {
      const messagesWithProfiles = await Promise.all(
        data.map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, first_name, last_name')
            .eq('id', msg.user_id)
            .single();

          return {
            ...msg,
            sender: profile || { username: null, first_name: null, last_name: null }
          };
        })
      );

      setMessages(messagesWithProfiles);
    }
  };

  const loadMembers = async (communityId: string) => {
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        id,
        user_id,
        profiles:user_id (
          username,
          first_name,
          last_name
        )
      `)
      .eq('community_id', communityId);

    if (error) {
      console.error('Error loading members:', error);
      return;
    }

    if (data) {
      const membersData = data.map(member => ({
        id: member.id,
        user_id: member.user_id,
        username: (member.profiles as any)?.username || null,
        first_name: (member.profiles as any)?.first_name || null,
        last_name: (member.profiles as any)?.last_name || null,
      }));
      setMembers(membersData);
    }
  };

  const subscribeToMessages = (communityId: string) => {
    console.log('[Realtime] Subscribing to messages for community:', communityId);

    const channel = supabase
      .channel(`community-messages-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`
        },
        async (payload) => {
          console.log('[Realtime] New message received:', payload.new);

          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, first_name, last_name')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: Message = {
            id: payload.new.id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            user_id: payload.new.user_id,
            sender: profileData || { username: null, first_name: null, last_name: null }
          };

          console.log('[Realtime] Adding message to state:', newMessage);

          setMessages((prev) => {
            // Evitar duplicados
            if (prev.some(msg => msg.id === newMessage.id)) {
              console.log('[Realtime] Message already exists, skipping');
              return prev;
            }
            console.log('[Realtime] Message added to chat');
            return [...prev, newMessage];
          });
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] ✅ Successfully subscribed to messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Realtime] ❌ Channel error - check RLS policies');
        } else if (status === 'TIMED_OUT') {
          console.error('[Realtime] ❌ Connection timed out');
        }
      });

    return () => {
      console.log('[Realtime] Unsubscribing from messages');
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMembers = (communityId: string) => {
    const channel = supabase
      .channel(`community-members-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_members',
          filter: `community_id=eq.${communityId}`
        },
        () => {
          loadMembers(communityId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || !communityId || !currentUserId) return;

    // Rate limiting check (15 messages per minute)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    messageSendTimestamps.current = messageSendTimestamps.current.filter(t => t > oneMinuteAgo);

    if (messageSendTimestamps.current.length >= 15) {
      const oldestTimestamp = Math.min(...messageSendTimestamps.current);
      const waitSeconds = Math.ceil((60000 - (now - oldestTimestamp)) / 1000);
      toast({
        title: "Espera un momento",
        description: `Por favor espera ${waitSeconds} segundos antes de enviar otro mensaje.`,
        variant: "destructive",
      });
      return;
    }
    messageSendTimestamps.current.push(now);

    setIsSending(true);
    const messageText = input.trim();
    setInput('');

    // Mensaje optimista
    const tempId = `opt-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      message: messageText,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      sender: { username: null, first_name: null, last_name: null }
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const { data: inserted, error } = await supabase
        .from('community_messages')
        .insert([{
          community_id: communityId,
          user_id: currentUserId,
          message: messageText
        }])
        .select('id, message, created_at, user_id')
        .single();

      if (error) throw error;

      // Reemplazar el mensaje optimista con el definitivo
      if (inserted) {
        setMessages(prev => prev.map(m => m.id === tempId ? {
          id: inserted.id,
          message: inserted.message,
          created_at: inserted.created_at,
          user_id: inserted.user_id,
          sender: { username: null, first_name: null, last_name: null }
        } : m));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Revertir mensaje optimista y restaurar input
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInput(messageText);
      toast({
        title: "Error",
        description: "No se pudo enviar el mensaje",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const getUserDisplayName = (sender: Message['sender']) => {
    if (sender.username) return sender.username;
    if (sender.first_name) return `${sender.first_name} ${sender.last_name || ''}`.trim();
    return 'Usuario';
  };

  const getMemberDisplayName = (member: Member) => {
    if (member.username) return member.username;
    if (member.first_name) return `${member.first_name} ${member.last_name || ''}`.trim();
    return 'Usuario';
  };

  const formatConcertDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return '';
    }
  };

  const getMembersPreview = () => {
    return members.slice(0, 3).map(m => getMemberDisplayName(m)).join(', ') +
      (members.length > 3 ? '...' : '');
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-background">
        {/* Header skeleton */}
        <div className="h-14 bg-primary flex items-center px-4 gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-primary-foreground/20 rounded animate-pulse" />
            <div className="h-3 w-24 bg-primary-foreground/20 rounded mt-1 animate-pulse" />
          </div>
        </div>
        {/* Loading content */}
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* WhatsApp-style Header */}
      <header className="bg-primary text-primary-foreground px-2 py-2 flex items-center gap-2 safe-area-top shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            // Try to go back, or navigate to concert detail if no history
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate(`/concerts/${concertId}`);
            }
          }}
          className="text-primary-foreground hover:bg-primary-foreground/10 shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Sheet open={infoOpen} onOpenChange={setInfoOpen}>
          <SheetTrigger asChild>
            <button className="flex items-center gap-3 flex-1 min-w-0 text-left hover:bg-primary-foreground/10 rounded-lg px-2 py-1 transition-colors">
              {/* Group Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 shrink-0 overflow-hidden">
                {concertInfo.image_url ? (
                  <img
                    src={concertInfo.image_url}
                    alt={concertInfo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary-foreground/70" />
                  </div>
                )}
              </div>

              {/* Group Info */}
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-sm truncate">{concertInfo.title}</h1>
                <p className="text-xs text-primary-foreground/70 truncate">
                  {getMembersPreview()}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-primary-foreground/50 shrink-0" />
            </button>
          </SheetTrigger>

          {/* Group Info Sheet */}
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <div className="flex flex-col h-full">
              {/* Header Image */}
              <div className="relative h-48 bg-gradient-to-b from-primary/20 to-background">
                {concertInfo.image_url ? (
                  <img
                    src={concertInfo.image_url}
                    alt={concertInfo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Users className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
              </div>

              {/* Concert Info */}
              <div className="px-4 -mt-8 relative z-10">
                <h2 className="text-xl font-bold">{concertInfo.title}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <span>Grupo</span>
                  <span>·</span>
                  <span className="text-primary">{members.length} miembros</span>
                </p>
                {concertInfo.date && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    {formatConcertDate(concertInfo.date)}
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Members List */}
              <div className="flex-1 overflow-hidden">
                <div className="px-4 mb-2">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {members.length} miembros
                  </h3>
                </div>
                <ScrollArea className="h-[calc(100%-2rem)]">
                  <div className="px-4 space-y-1 pb-4">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {getMemberDisplayName(member).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {getMemberDisplayName(member)}
                            {member.user_id === currentUserId && (
                              <span className="text-xs text-muted-foreground ml-1">(tú)</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden bg-muted/30">
        <ScrollArea className="h-full">
          <div className="px-3 py-4 space-y-3 min-h-full">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  ¡Sé el primero en enviar un mensaje!
                </p>
              </div>
            )}
            {messages.map((msg) => {
              const isOwn = msg.user_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${isOwn
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-card text-card-foreground rounded-bl-md'
                      }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-semibold mb-0.5 text-primary">
                        {getUserDisplayName(msg.sender)}
                      </p>
                    )}
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-[10px] mt-1 text-right ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                      {new Date(msg.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - WhatsApp style */}
      <div className="bg-background border-t px-2 py-2 safe-area-bottom shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex items-center gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Mensaje"
            disabled={isSending}
            className="flex-1 rounded-full bg-muted border-0 focus-visible:ring-1 focus-visible:ring-primary"
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
