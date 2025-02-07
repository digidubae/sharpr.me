"use client";

import { Editor as TinyMCEEditor } from "tinymce";
import { Editor } from "@tinymce/tinymce-react";
import { useRef, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import imageCompression from "browser-image-compression";
import { getSignalTriggers, getSignalByTrigger, handleSignal, setupSignalInteractions } from "@/utils/signals";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  editable?: boolean;
  autoFocus?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  onKeyDown,
  editable = true,
  autoFocus = false,
}: RichTextEditorProps) {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={`h-[300px] w-full bg-${isDarkMode ? 'gray-800' : 'white'} rounded-md border border-gray-200 dark:border-gray-700`} />;
  }

  // Function to handle image uploads with compression
  const images_upload_handler = async (blobInfo: any) => {
    try {
      // Get the blob from blobInfo
      const imageFile = new File(
        [blobInfo.blob()],
        blobInfo.filename() || "image.png",
        {
          type: blobInfo.blob().type,
        }
      );

      const originalSize = imageFile.size / (1024 * 1024); // Convert to MB
      console.log(`Original image size: ${originalSize.toFixed(2)}MB`);

      // Compression options
      const options = {
        maxSizeMB: 0.3, // Reduce to max 300KB for more aggressive compression
        maxWidthOrHeight: 1200, // Slightly reduced max dimensions
        useWebWorker: true,
        initialQuality: 0.7, // Reduced initial quality for more compression
      };

      // Compress the image
      console.log("Starting image compression...");
      const compressedFile = await imageCompression(imageFile, options);
      const compressedSize = compressedFile.size / (1024 * 1024); // Convert to MB
      console.log(`Compressed image size: ${compressedSize.toFixed(2)}MB`);
      console.log(
        `Compression ratio: ${(
          (1 - compressedSize / originalSize) *
          100
        ).toFixed(1)}%`
      );

      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          console.log(`Final base64 length: ${result.length} characters`);
          resolve(result);
        };
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      console.error("Error compressing image:", error);
      // Fallback to original image if compression fails
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blobInfo.blob());
      });
    }
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

        // Initialize signal interactions
        setupSignalInteractions(editor);

        // Setup autocompleter for signals
        editor.ui.registry.addAutocompleter('signals', {
          trigger: '@',
          minChars: 0,
          columns: 1,
          fetch: (pattern) => {
            const signals = getSignalTriggers();
            const matchedSignals = signals.filter(signal => 
              signal.toLowerCase().includes(pattern.toLowerCase())
            );

            return Promise.resolve(
              matchedSignals.map(signal => ({
                value: signal,
                text: signal,
                meta: getSignalByTrigger(signal)?.description || ''
              }))
            );
          },
          onAction: async (autocompleteApi, rng, value) => {
            const signal = getSignalByTrigger(value);
            if (signal) {
              editor.selection.setRng(rng);
              await handleSignal(editor, signal);
            }
            autocompleteApi.hide();
          }
        });
      }}
      value={content}
      onEditorChange={(newContent) => onChange(newContent)}
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      init={{
        promotion: false,
        height: 300,
        menubar: false,
        branding: false,
        deprecation_warnings: false,
        verify_html: false,
        extended_valid_elements: "*[*]",
        valid_children: "+body[style]",
        plugins: [
          "lists",
          "image",
          "table",
          "autolink",
          "autoresize",
          "directionality"
        ].join(" "),
        toolbar: editable
          ? "ltr rtl | undo redo | blocks | " +
          "strikethrough | " +
            "forecolor backcolor | " +
            "alignleft aligncenter " +
            "alignright alignjustify | bullist numlist | " +
            "table | " +
            "image"
          : false,
        skin: isDarkMode ? "oxide-dark" : "oxide",
        content_css: isDarkMode ? "dark" : "default",
        // @ts-ignore
        license_key: "gpl",
        disabled: !editable,
        paste_data_images: true,
        auto_focus: autoFocus
          ? "tiny-react_" + Date.now().toString()
          : undefined,
        setup: (editor) => {
          editor.on("keydown", (e) => {
            if (onKeyDown) {
              onKeyDown(e as unknown as KeyboardEvent);
            }
          });
        },
        images_upload_handler,
        // Add custom CSS for signal styling
        content_style: `
          .signal-content { position: relative; }
          .signal-content:hover { background: rgba(74, 144, 226, 0.1); }
        `,
      }}
    />
  );
}
