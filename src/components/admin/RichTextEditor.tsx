import { useEffect, useCallback, useState, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TiptapLink from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TiptapImage from '@tiptap/extension-image';
import { Label } from '@/components/ui/label';
import { EditorToolbar } from './editor/EditorToolbar';
import { EditorBubbleMenu } from './editor/EditorBubbleMenu';
import { SlashCommand } from './editor/SlashCommand';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, label, placeholder }: RichTextEditorProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        horizontalRule: {},
        blockquote: {},
        codeBlock: {},
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-primary underline' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return '¿Cuál es el título?';
          return placeholder || "Escribe algo o presiona '/' para comandos...";
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      TiptapImage.configure({
        HTMLAttributes: { class: 'max-w-full rounded-lg' },
        allowBase64: true,
      }),
      SlashCommand,
    ],
    [placeholder],
  );

  const editor = useEditor({
    extensions,
    content: value || '',
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    editorProps: {
      attributes: {
        class:
          'tiptap min-h-[400px] px-6 py-4 focus:outline-none text-base leading-relaxed',
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;

        const file = files[0];
        if (!file.type.startsWith('image/')) return false;

        event.preventDefault();
        const reader = new FileReader();
        reader.onload = () => {
          const src = reader.result as string;
          view.dispatch(
            view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src }),
            ),
          );
        };
        reader.readAsDataURL(file);
        return true;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file) continue;
            const reader = new FileReader();
            reader.onload = () => {
              const src = reader.result as string;
              view.dispatch(
                view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes.image.create({ src }),
                ),
              );
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  const syncContent = useCallback(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    const normalised = currentHtml === '<p></p>' ? '' : currentHtml;
    if (normalised !== value) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor?.isFocused) syncContent();
  }, [syncContent, editor?.isFocused]);

  if (!editor) return null;

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div
        className={`rounded-lg border bg-background overflow-hidden transition-colors ${
          isFocused ? 'border-primary ring-1 ring-primary/20' : 'border-border'
        }`}
      >
        <EditorToolbar editor={editor} />
        <EditorBubbleMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
