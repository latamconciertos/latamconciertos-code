import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const ChatInput = ({ input, onInputChange, onSubmit, isLoading }: ChatInputProps) => {
  return (
    <div className="p-4 shrink-0">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={onSubmit} className="relative">
          <Input
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
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
  );
};

export default ChatInput;
