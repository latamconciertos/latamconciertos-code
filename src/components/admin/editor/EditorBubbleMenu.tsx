import { useState, useCallback } from 'react';
import { BubbleMenu, type Editor } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link2,
  Unlink,
  Highlighter,
} from 'lucide-react';

interface EditorBubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);

  const handleSetLink = useCallback(() => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkUrl('');
    setLinkOpen(false);
  }, [editor, linkUrl]);

  const openLinkPopover = () => {
    const existingLink = editor.getAttributes('link').href ?? '';
    setLinkUrl(existingLink);
    setLinkOpen(true);
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 150,
        placement: 'top',
        animation: 'shift-toward-subtle',
      }}
      className="flex items-center gap-0.5 rounded-lg border bg-popover px-1.5 py-1 shadow-xl"
    >
      <BubbleToggle
        icon={Bold}
        pressed={editor.isActive('bold')}
        onPress={() => editor.chain().focus().toggleBold().run()}
        tooltip="Negrita"
      />
      <BubbleToggle
        icon={Italic}
        pressed={editor.isActive('italic')}
        onPress={() => editor.chain().focus().toggleItalic().run()}
        tooltip="Cursiva"
      />
      <BubbleToggle
        icon={Underline}
        pressed={editor.isActive('underline')}
        onPress={() => editor.chain().focus().toggleUnderline().run()}
        tooltip="Subrayado"
      />
      <BubbleToggle
        icon={Strikethrough}
        pressed={editor.isActive('strike')}
        onPress={() => editor.chain().focus().toggleStrike().run()}
        tooltip="Tachado"
      />
      <BubbleToggle
        icon={Code}
        pressed={editor.isActive('code')}
        onPress={() => editor.chain().focus().toggleCode().run()}
        tooltip="Código inline"
      />
      <BubbleToggle
        icon={Highlighter}
        pressed={editor.isActive('highlight')}
        onPress={() =>
          editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()
        }
        tooltip="Resaltar"
      />

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Toggle
            size="sm"
            pressed={editor.isActive('link')}
            onPressedChange={openLinkPopover}
            className="h-7 w-7 p-0"
            title="Enlace"
          >
            <Link2 className="h-3.5 w-3.5" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="center" side="top">
          <div className="flex gap-1.5">
            <Input
              placeholder="https://..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetLink()}
              className="h-7 text-xs"
              autoFocus
            />
            <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSetLink}>
              OK
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {editor.isActive('link') && (
        <Toggle
          size="sm"
          pressed={false}
          onPressedChange={() => editor.chain().focus().unsetLink().run()}
          className="h-7 w-7 p-0"
          title="Quitar enlace"
        >
          <Unlink className="h-3.5 w-3.5" />
        </Toggle>
      )}
    </BubbleMenu>
  );
};

function BubbleToggle({
  icon: Icon,
  pressed,
  onPress,
  tooltip,
}: {
  icon: React.ComponentType<{ className?: string }>;
  pressed: boolean;
  onPress: () => void;
  tooltip: string;
}) {
  return (
    <Toggle
      size="sm"
      pressed={pressed}
      onPressedChange={onPress}
      className="h-7 w-7 p-0"
      title={tooltip}
    >
      <Icon className="h-3.5 w-3.5" />
    </Toggle>
  );
}
