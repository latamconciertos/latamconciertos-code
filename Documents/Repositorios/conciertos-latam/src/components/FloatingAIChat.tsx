import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const FloatingAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id ?? null);
      if (!session?.user) {
        setIsOpen(false);
        setMessages([]);
        setConversationId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleOpen = async () => {
    if (!userId) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para usar el asistente IA",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsOpen(true);

    // Crear conversación si no existe
    if (!conversationId && messages.length === 0) {
      const { data: conversation, error } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: 'Chat rápido',
        })
        .select()
        .single();

      if (!error && conversation) {
        setConversationId(conversation.id);
        setMessages([{
          role: 'assistant',
          content: '¡Hola! ¿En qué puedo ayudarte hoy?'
        }]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !userId) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
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
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener respuesta del asistente",
        variant: "destructive",
      });
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Lo siento, tuve un problema. Por favor, intenta de nuevo.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat flotante */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] shadow-2xl z-50 border-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Asistente IA</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="p-3 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón flotante */}
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl hover:scale-110 transition-transform z-40"
        size="icon"
        aria-label="Abrir asistente IA"
      >
        <Bot className="h-6 w-6" />
      </Button>
    </>
  );
};
