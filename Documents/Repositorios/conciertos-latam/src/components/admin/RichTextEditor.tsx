import { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Label } from '@/components/ui/label';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export const RichTextEditor = ({ value, onChange, label, placeholder }: RichTextEditorProps) => {
  const quillRef = useRef<ReactQuill>(null);

  // Configuración de la toolbar con herramientas básicas
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'color', 'background',
    'align',
    'list', 'bullet',
    'link'
  ];

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="rich-text-editor bg-background border rounded-md">
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          className="min-h-[300px]"
        />
      </div>
      <style>{`
        .rich-text-editor .ql-container {
          min-height: 300px;
          font-size: 16px;
        }
        
        .rich-text-editor .ql-editor {
          min-height: 300px;
        }
        
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.375rem;
          border-top-right-radius: 0.375rem;
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
        }
        
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.375rem;
          border-bottom-right-radius: 0.375rem;
          border-color: hsl(var(--border));
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        
        .rich-text-editor .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        
        .rich-text-editor .ql-fill {
          fill: hsl(var(--foreground));
        }
        
        .rich-text-editor .ql-picker-label {
          color: hsl(var(--foreground));
        }
        
        .rich-text-editor .ql-picker-options {
          background: hsl(var(--background));
          border-color: hsl(var(--border));
        }
        
        .rich-text-editor .ql-picker-item:hover {
          background: hsl(var(--muted));
        }
        
        .rich-text-editor .ql-toolbar button:hover,
        .rich-text-editor .ql-toolbar button.ql-active {
          color: hsl(var(--primary));
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }
        
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
};