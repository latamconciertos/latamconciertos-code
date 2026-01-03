import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, LogIn, Plus, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { linkifyText } from '@/lib/sanitize';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Verificar autenticación y cargar datos del usuario
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        setUserId(null);
        return;
      }

      setUserId(session.user.id);

      // Obtener nombre del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, username')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserName(profile.first_name || profile.username || 'Usuario');
      }

      // Cargar conversaciones existentes
      loadConversations(session.user.id);
    };

    initAuth();
  }, []);

  const loadConversations = async (uid: string) => {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', uid)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    setConversations(data || []);
  };

  const createNewConversation = async () => {
    if (!userId) return;

    const { data: conversation, error } = await supabase
      .from('ai_conversations')
      .insert({
        user_id: userId,
        title: 'Nueva conversación',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la conversación",
        variant: "destructive",
      });
      return;
    }

    setConversationId(conversation.id);
    setMessages([{
      role: 'assistant',
      content: `¡Hola${userName ? ' ' + userName : ''}! Soy tu asistente para conciertos. Puedo ayudarte a encontrar el concierto perfecto, recomendarte hoteles cercanos, sugerirte qué llevar al evento y mucho más. ¿En qué puedo ayudarte hoy?`
    }]);
    loadConversations(userId);
    setIsSidebarOpen(false);
  };

  const loadConversation = async (convId: string) => {
    setConversationId(convId);

    // Cargar mensajes de la conversación
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
      return;
    }

    const mappedMessages: Message[] = (data || []).map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

    setMessages(mappedMessages);
    setIsSidebarOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Verificar autenticación
    if (!userId) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para usar el asistente IA",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Guardar mensaje del usuario en la base de datos
      if (conversationId) {
        await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: userMessage,
        });
      }

      const response = await fetch(`https://ybvfsxsapsshhtqpvukr.supabase.co/functions/v1/ai-concert-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }],
          userId,
          conversationId,
        })
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del asistente');
      }

      const data = await response.json();
      const assistantMessage = data.response;

      setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Guardar el mensaje del asistente en la base de datos
      if (conversationId) {
        const { error: saveError } = await supabase.from('ai_messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantMessage,
        });

        if (saveError) {
          console.error('Error saving assistant message:', saveError);
        }
      }

      // Actualizar título de la conversación con el primer mensaje del usuario
      if (conversationId && messages.length === 1) {
        const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
        await supabase
          .from('ai_conversations')
          .update({ title, updated_at: new Date().toISOString() })
          .eq('id', conversationId);
        loadConversations(userId);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta del asistente. Intenta de nuevo.",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, tuve un problema al procesar tu solicitud. Por favor, intenta de nuevo.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Asistente IA de Conciertos"
        description="Pregunta a nuestro asistente IA sobre conciertos, fechas, hoteles cercanos y recomendaciones personalizadas para tus eventos favoritos."
        keywords="asistente IA, chatbot conciertos, recomendaciones eventos, asistente virtual música"
        url="/ai-assistant"
      />
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 flex pt-20 md:pt-24 overflow-hidden">
          {/* Sidebar para desktop */}
          <aside className="hidden lg:flex w-64 border-r border-border bg-card/50 flex-col h-full">
            <div className="p-4 border-b border-border">
              <Button
                onClick={createNewConversation}
                className="w-full"
                disabled={!userId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nueva conversación
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => loadConversation(conv.id)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${conversationId === conv.id ? 'bg-accent' : ''
                        }`}
                    >
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </aside>

          {/* Sidebar móvil */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
              <div className="p-4 border-b border-border shrink-0">
                <Button
                  onClick={createNewConversation}
                  className="w-full"
                  disabled={!userId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva conversación
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-2">
                    {conversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => loadConversation(conv.id)}
                        className={`w-full text-left p-3 rounded-lg hover:bg-accent transition-colors ${conversationId === conv.id ? 'bg-accent' : ''
                          }`}
                      >
                        <p className="text-sm font-medium truncate">{conv.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(conv.updated_at).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex flex-col">
            <div className="container mx-auto px-4 py-8 flex-1">
              <div className="max-w-4xl mx-auto h-full flex flex-col">
                {/* Botón menú móvil */}
                <div className="lg:hidden mb-4">
                  <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(true)}>
                    <Menu className="h-5 w-5" />
                  </Button>
                </div>
                {/* Mensaje de autenticación requerida */}
                {!userId && (
                  <Card className="mb-6 border-primary/50 bg-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <LogIn className="h-6 w-6 text-primary" />
                          <div>
                            <h3 className="font-semibold text-foreground">Inicia sesión para continuar</h3>
                            <p className="text-sm text-muted-foreground">
                              El asistente IA requiere que inicies sesión para guardar tus conversaciones
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => navigate('/auth')}>
                          Iniciar Sesión
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mostrar conversación o pantalla de inicio */}
                {!conversationId ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-2xl">
                      <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        <span className="text-primary font-semibold">Asistente IA</span>
                      </div>
                      <h1 className="text-4xl font-bold text-foreground mb-4">
                        ¡Hola{userName ? ' ' + userName : ''}!
                      </h1>
                      <p className="text-lg text-muted-foreground mb-8">
                        Soy tu asistente para conciertos. Puedo ayudarte a encontrar el concierto perfecto, recomendarte hoteles cercanos y mucho más.
                      </p>
                      <Button
                        onClick={createNewConversation}
                        size="lg"
                        disabled={!userId}
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Iniciar conversación
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Chat Container - Clean design without visible borders */}
                    <div className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(100vh - 140px)' }}>
                      {/* Messages Area with ScrollArea - Responsive height */}
                      <div
                        className="overflow-hidden"
                        style={{
                          height: window.innerWidth < 768 ? 'calc(100vh - 240px)' : 'calc(100vh - 180px)'
                        }}
                      >
                        <ScrollArea className="h-full">
                          <div className="max-w-3xl mx-auto px-6 py-4 space-y-4 min-h-full">
                            {messages.map((message, index) => (
                              <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card border border-border'
                                    }`}
                                >
                                  {message.role === 'assistant' ? (
                                    <div
                                      className="text-sm whitespace-pre-wrap prose prose-sm max-w-none"
                                      dangerouslySetInnerHTML={{
                                        __html: linkifyText(message.content.replace(/\*\*/g, ''))
                                      }}
                                    />
                                  ) : (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                            {isLoading && (
                              <div className="flex justify-start">
                                <div className="bg-card border border-border rounded-2xl px-4 py-3">
                                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </div>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                        </ScrollArea>
                      </div>


                      {/* Input Area - ChatGPT style, fixed at bottom */}
                      <div className="p-4 shrink-0">
                        <div className="max-w-3xl mx-auto">
                          <form onSubmit={handleSubmit} className="relative">
                            <Input
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              placeholder="Escribe tu pregunta aquí..."
                              disabled={isLoading}
                              className="flex-1 pr-12 py-6 text-base rounded-3xl border-2 focus-visible:ring-1"
                            />
                            <Button
                              type="submit"
                              disabled={isLoading || !input.trim()}
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                            >
                              {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                              ) : (
                                <Send className="h-5 w-5" />
                              )}
                            </Button>
                          </form>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    {messages.length === 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                          '¿Qué conciertos hay próximamente?',
                          'Recomiéndame hoteles cerca del venue',
                          '¿Qué debo llevar a un concierto?',
                          '¿Cuándo es el próximo concierto de [artista]?'
                        ].map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="text-left justify-start h-auto py-3 px-4"
                            onClick={() => setInput(suggestion)}
                            disabled={isLoading}
                          >
                            <span className="text-sm text-muted-foreground">{suggestion}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AIAssistant;
