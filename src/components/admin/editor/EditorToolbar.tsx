import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  Unlink,
  Quote,
  Minus,
  Undo,
  Redo,
  ImageIcon,
  Highlighter,
  Type,
} from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor;
}

type HeadingLevel = '0' | '2' | '3' | '4';

export const EditorToolbar = ({ editor }: EditorToolbarProps) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageOpen, setImageOpen] = useState(false);

  const currentHeading = (): HeadingLevel => {
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    if (editor.isActive('heading', { level: 4 })) return '4';
    return '0';
  };

  const handleHeadingChange = (value: HeadingLevel) => {
    if (value === '0') {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level: Number(value) as 2 | 3 | 4 }).run();
    }
  };

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

  const handleInsertImage = useCallback(() => {
    if (!imageUrl.trim()) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setImageOpen(false);
  }, [editor, imageUrl]);

  const openLinkPopover = () => {
    const existingLink = editor.getAttributes('link').href ?? '';
    setLinkUrl(existingLink);
    setLinkOpen(true);
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/40">
      {/* Heading selector */}
      <Select value={currentHeading()} onValueChange={(v) => handleHeadingChange(v as HeadingLevel)}>
        <SelectTrigger className="w-[130px] h-8 text-xs border-0 bg-transparent hover:bg-muted focus:ring-0 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">
            <div className="flex items-center gap-2">
              <Type className="h-3.5 w-3.5" />
              <span>Párrafo</span>
            </div>
          </SelectItem>
          <SelectItem value="2">
            <span className="font-bold text-lg">Título</span>
          </SelectItem>
          <SelectItem value="3">
            <span className="font-semibold text-base">Subtítulo</span>
          </SelectItem>
          <SelectItem value="4">
            <span className="font-medium text-sm">Subtítulo menor</span>
          </SelectItem>
        </SelectContent>
      </Select>

      <ToolbarSep />

      {/* Text formatting */}
      <ToolbarToggle
        icon={Bold}
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        tooltip="Negrita (⌘B)"
      />
      <ToolbarToggle
        icon={Italic}
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        tooltip="Cursiva (⌘I)"
      />
      <ToolbarToggle
        icon={Underline}
        pressed={editor.isActive('underline')}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        tooltip="Subrayado (⌘U)"
      />
      <ToolbarToggle
        icon={Strikethrough}
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        tooltip="Tachado"
      />
      <ToolbarToggle
        icon={Highlighter}
        pressed={editor.isActive('highlight')}
        onPressedChange={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()}
        tooltip="Resaltar"
      />

      <ToolbarSep />

      {/* Alignment */}
      <ToolbarToggle
        icon={AlignLeft}
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
        tooltip="Alinear izquierda"
      />
      <ToolbarToggle
        icon={AlignCenter}
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
        tooltip="Centrar"
      />
      <ToolbarToggle
        icon={AlignRight}
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
        tooltip="Alinear derecha"
      />

      <ToolbarSep />

      {/* Lists */}
      <ToolbarToggle
        icon={List}
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        tooltip="Lista con viñetas"
      />
      <ToolbarToggle
        icon={ListOrdered}
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        tooltip="Lista numerada"
      />
      <ToolbarToggle
        icon={Quote}
        pressed={editor.isActive('blockquote')}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        tooltip="Cita"
      />

      <ToolbarSep />

      {/* Link */}
      <Popover open={linkOpen} onOpenChange={setLinkOpen}>
        <PopoverTrigger asChild>
          <Toggle
            size="sm"
            pressed={editor.isActive('link')}
            onPressedChange={openLinkPopover}
            className="h-8 w-8 p-0"
            title="Enlace (⌘K)"
          >
            <Link2 className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="flex gap-2">
            <Input
              placeholder="https://ejemplo.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetLink()}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" className="h-8 px-3" onClick={handleSetLink}>
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
          className="h-8 w-8 p-0"
          title="Quitar enlace"
        >
          <Unlink className="h-4 w-4" />
        </Toggle>
      )}

      {/* Image */}
      <Popover open={imageOpen} onOpenChange={setImageOpen}>
        <PopoverTrigger asChild>
          <Toggle
            size="sm"
            pressed={false}
            onPressedChange={() => setImageOpen(true)}
            className="h-8 w-8 p-0"
            title="Insertar imagen"
          >
            <ImageIcon className="h-4 w-4" />
          </Toggle>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="flex gap-2">
            <Input
              placeholder="URL de la imagen"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleInsertImage()}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" className="h-8 px-3" onClick={handleInsertImage}>
              OK
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Horizontal rule */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        className="h-8 w-8 p-0"
        title="Línea divisoria"
      >
        <Minus className="h-4 w-4" />
      </Toggle>

      <ToolbarSep />

      {/* Undo / Redo */}
      <Toggle
        size="sm"
        pressed={false}
        disabled={!editor.can().undo()}
        onPressedChange={() => editor.chain().focus().undo().run()}
        className="h-8 w-8 p-0"
        title="Deshacer (⌘Z)"
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        disabled={!editor.can().redo()}
        onPressedChange={() => editor.chain().focus().redo().run()}
        className="h-8 w-8 p-0"
        title="Rehacer (⌘⇧Z)"
      >
        <Redo className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

function ToolbarSep() {
  return <Separator orientation="vertical" className="mx-1 h-6" />;
}

function ToolbarToggle({
  icon: Icon,
  pressed,
  onPressedChange,
  tooltip,
}: {
  icon: React.ComponentType<{ className?: string }>;
  pressed: boolean;
  onPressedChange: () => void;
  tooltip: string;
}) {
  return (
    <Toggle
      size="sm"
      pressed={pressed}
      onPressedChange={onPressedChange}
      className="h-8 w-8 p-0"
      title={tooltip}
    >
      <Icon className="h-4 w-4" />
    </Toggle>
  );
}
