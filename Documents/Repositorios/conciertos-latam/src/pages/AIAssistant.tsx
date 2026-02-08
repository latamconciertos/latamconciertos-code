import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageCircle, LogIn, Plus, Menu, X, MoreVertical, Pencil, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { generateConversationTitle } from '@/lib/ai/conversationUtils';
import type { Message, Conversation } from '@/types/aiAssistant';
import { useAIConversations } from '@/hooks/useAIConversations';

const AIAssistant = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Rate limiting: track message timestamps (8 messages per minute - controls OpenAI costs)
  const messageSendTimestamps = useRef<number[]>([]);

  // Use conversation management hook
  const conversationHook = useAIConversations({ userId, userName });

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
      setUserName(session.user.user_metadata?.full_name || session.user.email || 'Usuario');
    };

    initAuth();
  }, []);

  // Wrapper for createNewConversation that also resets messages
  const handleCreateNewConversation = () => {
    conversationHook.createNewConversation();
    setMessages([{
      role: 'bot',
      content: `¡Hola${userName ? ' ' + userName : ''}! Soy tu asistente para conciertos. Puedo ayudarte a encontrar el concierto perfecto, recomendarte hoteles cercanos, sugerirte qué llevar al evento y mucho más. ¿En qué puedo ayudarte hoy?`
    }]);
    setIsSidebarOpen(false);
  };

  // Wrapper for loadConversation that also sets messages
  const handleLoadConversation = async (convId: string) => {
    const msgs = await conversationHook.loadConversation(convId);
    setMessages(msgs);
    setIsSidebarOpen(false);
  };

  // Wrapper for handleDeleteConversation that also clears messages
  const handleDelete = async () => {
    const isCurrentConv = conversationHook.conversationToDelete === conversationHook.conversationId;
    await conversationHook.handleDeleteConversation();
    if (isCurrentConv) {
      setMessages([]);
    }
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

    // Rate limiting check (8 messages per minute - controls OpenAI costs)
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    messageSendTimestamps.current = messageSendTimestamps.current.filter(t => t > oneMinuteAgo);

    if (messageSendTimestamps.current.length >= 8) {
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

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      console.log('[AI Assistant] Starting message submission...');
      console.log('[AI Assistant] User message:', userMessage);

      // 🔧 FIX: Crear conversación automáticamente si no existe
      let currentConversationId = conversationHook.conversationId;

      if (!currentConversationId) {
        console.log('[AI Assistant] No active conversation, creating new one...');
        try {
          currentConversationId = await conversationHook.createConversationWithTitle(userId, userMessage);
          console.log('[AI Assistant] Conversation created successfully:', currentConversationId);
        } catch (convError) {
          console.error('[AI Assistant] Error creating conversation:', convError);
          throw new Error('No se pudo crear la conversación');
        }
      } else {
        console.log('[AI Assistant] Using existing conversation:', currentConversationId);
      }

      // Guardar mensaje del usuario en la base de datos
      console.log('[AI Assistant] Saving user message...');
      try {
        const { error: userMsgError } = await supabase.from('ai_messages').insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: userMessage,
        });

        if (userMsgError) {
          console.error('[AI Assistant] Error saving user message:', userMsgError);
          throw userMsgError;
        }
        console.log('[AI Assistant] User message saved successfully');
      } catch (msgError) {
        console.error('[AI Assistant] Failed to save user message:', msgError);
        throw new Error('No se pudo guardar tu mensaje');
      }

      // Llamar a la Edge Function
      console.log('[AI Assistant] Calling Edge Function...');
      console.log('[AI Assistant] Messages being sent:', messages.length, 'messages');
      console.log('[AI Assistant] Full messages array:', JSON.stringify(messages, null, 2));
      let response;
      try {
        response = await fetch(`https://ybvfsxsapsshhtqpvukr.supabase.co/functions/v1/ai-concert-assistant`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, { role: 'user', content: userMessage }],
            userId,
            conversationId: currentConversationId,
          })
        });

        console.log('[AI Assistant] Edge Function response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[AI Assistant] Edge Function error response:', errorText);
          throw new Error(`Error ${response.status}: ${errorText}`);
        }
      } catch (fetchError) {
        console.error('[AI Assistant] Error calling Edge Function:', fetchError);
        throw new Error('No se pudo contactar con el asistente');
      }

      const data = await response.json();
      console.log('[AI Assistant] Response from AI assistant:', data);

      const assistantMessage = data.response;

      if (!assistantMessage) {
        console.error('[AI Assistant] No response content received');
        throw new Error('El asistente no devolvió una respuesta');
      }

      // Actualizar UI con la respuesta del asistente
      setMessages(prev => [...prev, { role: 'bot' as const, content: assistantMessage }]);

      // Guardar respuesta del asistente
      console.log('[AI Assistant] Saving assistant message to database...');
      try {
        const { error: saveError } = await supabase.from('ai_messages').insert({
          conversation_id: currentConversationId,
          role: 'bot',
          content: assistantMessage,
        });

        if (saveError) {
          console.error('[AI Assistant] Error saving assistant message:', saveError);
          toast({
            title: "Advertencia",
            description: "La respuesta no se pudo guardar en el historial",
          });
        } else {
          console.log('[AI Assistant] Assistant message saved successfully');
        }
      } catch (saveError) {
        console.error('[AI Assistant] Failed to save assistant message:', saveError);
        // No lanzar error aquí, la respuesta ya se mostró al usuario
      }

      // Actualizar timestamp de la conversación
      console.log('[AI Assistant] Updating conversation timestamp...');
      try {
        await supabase
          .from('ai_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentConversationId);
      } catch (updateError) {
        console.error('[AI Assistant] Error updating conversation timestamp:', updateError);
        // No lanzar error, no es crítico
      }

      conversationHook.loadConversations(userId);
      console.log('[AI Assistant] Message submission completed successfully');
    } catch (error: any) {
      console.error('[AI Assistant] Fatal error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo obtener respuesta del asistente. Intenta de nuevo.",
        variant: "destructive",
      });
      setMessages(prev => [...prev, {
        role: 'bot' as const,
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
                onClick={handleCreateNewConversation}
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
                  {conversationHook.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`relative group p-3 rounded-lg hover:bg-accent transition-colors ${conversationHook.conversationId === conv.id ? 'bg-accent' : ''}`}
                    >
                      {conversationHook.renamingConversation === conv.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={conversationHook.renameValue}
                            onChange={(e) => conversationHook.setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') conversationHook.handleRenameConversation(conv.id);
                              if (e.key === 'Escape') {
                                conversationHook.setRenamingConversation(null);
                                conversationHook.setRenameValue('');
                              }
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => conversationHook.handleRenameConversation(conv.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handleLoadConversation(conv.id)}
                          className="cursor-pointer pr-8"
                        >
                          <p className="text-sm font-medium truncate">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conv.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {conversationHook.renamingConversation !== conv.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                conversationHook.setRenamingConversation(conv.id);
                                conversationHook.setRenameValue(conv.title);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Renombrar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                conversationHook.setConversationToDelete(conv.id);
                                conversationHook.setDeleteDialogOpen(true);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
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
                  onClick={handleCreateNewConversation}
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
                    {conversationHook.conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`relative group p-3 rounded-lg hover:bg-accent transition-colors ${conversationHook.conversationId === conv.id ? 'bg-accent' : ''}`}
                        onTouchStart={() => conversationHook.handleLongPressStart(conv.id, conv.title)}
                        onTouchEnd={conversationHook.handleLongPressEnd}
                        onMouseDown={() => conversationHook.handleLongPressStart(conv.id, conv.title)}
                        onMouseUp={conversationHook.handleLongPressEnd}
                        onMouseLeave={conversationHook.handleLongPressEnd}
                      >
                        {conversationHook.renamingConversation === conv.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={conversationHook.renameValue}
                              onChange={(e) => conversationHook.setRenameValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') conversationHook.handleRenameConversation(conv.id);
                                if (e.key === 'Escape') {
                                  conversationHook.setRenamingConversation(null);
                                  conversationHook.setRenameValue('');
                                }
                              }}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={() => conversationHook.handleRenameConversation(conv.id)}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            onClick={() => handleLoadConversation(conv.id)}
                            className="cursor-pointer pr-8"
                          >
                            <p className="text-sm font-medium truncate">{conv.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(conv.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        {conversationHook.renamingConversation !== conv.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 h-7 w-7"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  conversationHook.setRenamingConversation(conv.id);
                                  conversationHook.setRenameValue(conv.title);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Renombrar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  conversationHook.setConversationToDelete(conv.id);
                                  conversationHook.setDeleteDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1 flex flex-col">
            <div className="container mx-auto px-4 py-4 md:py-8 flex-1">
              <div className="max-w-4xl mx-auto h-full flex flex-col">
                {/* Mensaje de autenticación requerida */}
                {!userId && (
                  <Card className="mb-6 border-primary/50 bg-primary/5">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <LogIn className="h-6 w-6 text-primary shrink-0" />
                          <div>
                            <h3 className="font-semibold text-foreground">Inicia sesión para continuar</h3>
                            <p className="text-sm text-muted-foreground">
                              El asistente IA requiere que inicies sesión para guardar tus conversaciones
                            </p>
                          </div>
                        </div>
                        <Button onClick={() => navigate('/auth')} className="w-full sm:w-auto">
                          Iniciar Sesión
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mostrar conversación o pantalla de inicio */}
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col">
                    {/* Header móvil con botón menú */}
                    <div className="lg:hidden flex items-center justify-between py-2 mb-4">
                      <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                      </Button>
                      <span className="text-sm text-muted-foreground">Historial</span>
                      <div className="w-9" /> {/* Spacer para centrar */}
                    </div>

                    {/* Contenido centrado */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center px-6 max-w-sm mx-auto">
                        <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
                          <MessageCircle className="h-5 w-5 text-primary" />
                          <span className="text-primary font-semibold">Asistente IA</span>
                        </div>

                        {/* Saludo simple y limpio */}
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                          ¡Hola{userName ? ` ${userName.includes('@') ? userName.split('@')[0] : userName}` : ''}!
                        </h1>

                        <p className="text-muted-foreground mb-8 leading-relaxed">
                          Soy tu asistente para conciertos. Puedo ayudarte a encontrar el concierto perfecto, recomendarte hoteles cercanos y mucho más.
                        </p>

                        <Button
                          onClick={handleCreateNewConversation}
                          size="lg"
                          disabled={!userId}
                          className="px-8"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Iniciar conversación
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Botón menú móvil para chat activo */}
                    <div className="lg:hidden mb-3">
                      <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-5 w-5" />
                      </Button>
                    </div>

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
                          <div className="max-w-3xl mx-auto px-6 py-4 space-y-4 min-h-full flex flex-col">
                            {messages.length === 0 ? (
                              <div className="flex-1 flex items-center justify-center">
                                <div className="w-full max-w-2xl space-y-6">
                                  <div className="text-center space-y-2">
                                    <h3 className="text-lg font-semibold">¿En qué puedo ayudarte?</h3>
                                    <p className="text-sm text-muted-foreground">Selecciona una pregunta o escribe la tuya</p>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                      '¿Qué conciertos hay próximamente?',
                                      'Recomiéndame hoteles cerca del venue',
                                      '¿Qué debo llevar a un concierto?',
                                      '¿Cuándo es el próximo concierto de [artista]?'
                                    ].map((suggestion, index) => (
                                      <Button
                                        key={index}
                                        variant="outline"
                                        className="text-left justify-start h-auto py-3 px-4 hover:bg-accent"
                                        onClick={() => setInput(suggestion)}
                                        disabled={isLoading}
                                      >
                                        <span className="text-sm text-muted-foreground">{suggestion}</span>
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
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
                                      {message.role === 'bot' ? (
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
                              </>
                            )}
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


                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Alert Dialog para confirmar eliminación */}
      <AlertDialog open={conversationHook.deleteDialogOpen} onOpenChange={conversationHook.setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La conversación y todos sus mensajes serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AIAssistant;
