import { useState, useRef, useEffect } from 'react';
import { LogIn, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { SEO } from '@/components/SEO';
import Header from '@/components/Header';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Message } from '@/types/aiAssistant';
import { useAIConversations } from '@/hooks/useAIConversations';
import ConversationSidebar from '@/components/ai/ConversationSidebar';
import ChatMessageList from '@/components/ai/ChatMessageList';
import ChatInput from '@/components/ai/ChatInput';
import WelcomeScreen from '@/components/ai/WelcomeScreen';
import DeleteConversationDialog from '@/components/ai/DeleteConversationDialog';

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

  const handleDeleteRequest = (convId: string) => {
    conversationHook.setConversationToDelete(convId);
    conversationHook.setDeleteDialogOpen(true);
  };

  const handleRenameStart = (convId: string, title: string) => {
    conversationHook.setRenamingConversation(convId);
    conversationHook.setRenameValue(title);
  };

  const handleRenameCancel = () => {
    conversationHook.setRenamingConversation(null);
    conversationHook.setRenameValue('');
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
      // 🔧 FIX: Crear conversación automáticamente si no existe
      let currentConversationId = conversationHook.conversationId;

      if (!currentConversationId) {
        try {
          currentConversationId = await conversationHook.createConversationWithTitle(userId, userMessage);
        } catch (convError) {
          console.error('[AI Assistant] Error creating conversation:', convError);
          throw new Error('No se pudo crear la conversación');
        }
      }

      // Guardar mensaje del usuario en la base de datos
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
      } catch (msgError) {
        console.error('[AI Assistant] Failed to save user message:', msgError);
        throw new Error('No se pudo guardar tu mensaje');
      }

      // Llamar a la Edge Function
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

      const assistantMessage = data.response;

      if (!assistantMessage) {
        console.error('[AI Assistant] No response content received');
        throw new Error('El asistente no devolvió una respuesta');
      }

      // Actualizar UI con la respuesta del asistente
      setMessages(prev => [...prev, { role: 'bot' as const, content: assistantMessage }]);

      // Guardar respuesta del asistente
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
        }
      } catch (saveError) {
        console.error('[AI Assistant] Failed to save assistant message:', saveError);
        // No lanzar error aquí, la respuesta ya se mostró al usuario
      }

      // Actualizar timestamp de la conversación
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

  const sidebarProps = {
    conversations: conversationHook.conversations,
    activeConversationId: conversationHook.conversationId,
    onCreateNew: handleCreateNewConversation,
    onLoadConversation: handleLoadConversation,
    renamingConversation: conversationHook.renamingConversation,
    renameValue: conversationHook.renameValue,
    onRenameValueChange: conversationHook.setRenameValue,
    onRenameSubmit: conversationHook.handleRenameConversation,
    onRenameStart: handleRenameStart,
    onRenameCancel: handleRenameCancel,
    onDeleteRequest: handleDeleteRequest,
    isDisabled: !userId,
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
            <ConversationSidebar {...sidebarProps} variant="desktop" />
          </aside>

          {/* Sidebar móvil */}
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[280px] p-0 flex flex-col">
              <ConversationSidebar
                {...sidebarProps}
                variant="mobile"
                onLongPressStart={conversationHook.handleLongPressStart}
                onLongPressEnd={conversationHook.handleLongPressEnd}
              />
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
                  <WelcomeScreen
                    userName={userName}
                    onCreateConversation={handleCreateNewConversation}
                    isDisabled={!userId}
                    onOpenSidebar={() => setIsSidebarOpen(true)}
                  />
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
                      <ChatMessageList
                        messages={messages}
                        isLoading={isLoading}
                        onSuggestionClick={setInput}
                        messagesEndRef={messagesEndRef}
                      />

                      {/* Input Area - ChatGPT style, fixed at bottom */}
                      <ChatInput
                        input={input}
                        onInputChange={setInput}
                        onSubmit={handleSubmit}
                        isLoading={isLoading}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Alert Dialog para confirmar eliminación */}
      <DeleteConversationDialog
        open={conversationHook.deleteDialogOpen}
        onOpenChange={conversationHook.setDeleteDialogOpen}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AIAssistant;
