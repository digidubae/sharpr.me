'use client';

import { Editor as TinyMCEEditor } from 'tinymce';
import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';
import { useTheme } from 'next-themes';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  editable?: boolean;
  autoFocus?: boolean;
}

export default function RichTextEditor({ content, onChange, onKeyDown, editable = true, autoFocus = false }: RichTextEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Function to handle image uploads
  const images_upload_handler = async (blobInfo: any) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blobInfo.blob());
    });
  };

  return (
    <Editor
      onInit={(evt, editor) => {
        editorRef.current = editor;
        if (autoFocus) {
          editor.focus();
          editor.selection.select(editor.getBody(), true);
          editor.selection.collapse(false);
        }
      }}
      value={content}
      onEditorChange={(newContent) => onChange(newContent)}
      tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.7.2/tinymce.min.js"
      init={{
        promotion: false,
        height: 300,
        menubar: false,
        branding: false,
        deprecation_warnings: false,
        verify_html: false,
        extended_valid_elements: '*[*]',
        valid_children: '+body[style]',
        plugins: 'lists link image',
        toolbar: editable ? 
          'undo redo | formatselect | ' +
          'bold italic | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist | ' +
          'removeformat | image' : false,
        content_style: `
          body { 
            font-family: Helvetica, Arial, sans-serif; 
            font-size: 14px;
            ${isDarkMode ? `
              background-color: #1f2937;
              color: #e5e7eb;
            ` : `
              background-color: #ffffff;
              color: #000000;
            `}
          }
          ${isDarkMode ? `
            td, th {
              border-color: #374151 !important;
            }
            a { color: #60a5fa; }
          ` : `
            td, th {
              border-color: #e5e7eb !important;
            }
            a { color: #2563eb; }
          `}
        `,
        disabled: !editable,
        paste_data_images: true,
        skin: isDarkMode ? 'oxide-dark' : 'oxide',
        content_css: isDarkMode ? 'dark' : 'default',
        auto_focus: autoFocus ? 'tiny-react_' + Date.now().toString() : undefined,
        setup: (editor) => {
          editor.on('keydown', (e) => {
            if (onKeyDown) {
              onKeyDown(e as unknown as KeyboardEvent);
            }
          });
        },
        images_upload_handler
      }}
    />
  );
} 