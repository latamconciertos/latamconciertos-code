import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Conversation } from '@/types/aiAssistant';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onCreateNew: () => void;
  onLoadConversation: (convId: string) => void;
  renamingConversation: string | null;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onRenameSubmit: (convId: string) => void;
  onRenameStart: (convId: string, title: string) => void;
  onRenameCancel: () => void;
  onDeleteRequest: (convId: string) => void;
  onLongPressStart?: (convId: string, title: string) => void;
  onLongPressEnd?: () => void;
  isDisabled: boolean;
  variant: 'desktop' | 'mobile';
}

const ConversationSidebar = ({
  conversations,
  activeConversationId,
  onCreateNew,
  onLoadConversation,
  renamingConversation,
  renameValue,
  onRenameValueChange,
  onRenameSubmit,
  onRenameStart,
  onRenameCancel,
  onDeleteRequest,
  onLongPressStart,
  onLongPressEnd,
  isDisabled,
  variant,
}: ConversationSidebarProps) => {
  const isMobile = variant === 'mobile';

  return (
    <>
      <div className={isMobile ? "p-4 border-b border-border shrink-0" : "p-4 border-b border-border"}>
        <Button
          onClick={onCreateNew}
          className="w-full"
          disabled={isDisabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva conversación
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`relative group p-3 rounded-lg hover:bg-accent transition-colors ${activeConversationId === conv.id ? 'bg-accent' : ''}`}
                {...(isMobile && onLongPressStart && onLongPressEnd ? {
                  onTouchStart: () => onLongPressStart(conv.id, conv.title),
                  onTouchEnd: onLongPressEnd,
                  onMouseDown: () => onLongPressStart(conv.id, conv.title),
                  onMouseUp: onLongPressEnd,
                  onMouseLeave: onLongPressEnd,
                } : {})}
              >
                {renamingConversation === conv.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={renameValue}
                      onChange={(e) => onRenameValueChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onRenameSubmit(conv.id);
                        if (e.key === 'Escape') onRenameCancel();
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={() => onRenameSubmit(conv.id)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={() => onLoadConversation(conv.id)}
                    className="cursor-pointer pr-8"
                  >
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {renamingConversation !== conv.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute right-2 top-2 h-7 w-7 ${isMobile ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onRenameStart(conv.id, conv.title)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Renombrar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeleteRequest(conv.id)}
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
    </>
  );
};

export default ConversationSidebar;
