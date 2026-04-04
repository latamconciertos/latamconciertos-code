import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { linkifyText } from '@/lib/sanitize';
import type { Message } from '@/types/aiAssistant';

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSuggestionClick: (suggestion: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const ChatMessageList = ({ messages, isLoading, onSuggestionClick, messagesEndRef }: ChatMessageListProps) => {
  return (
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
                      onClick={() => onSuggestionClick(suggestion)}
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
  );
};

export default ChatMessageList;
