import { Editor as TinyMCEEditor } from 'tinymce';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import SignalDatePicker from '@/components/SignalDatePicker';

const SignalDatePickerDynamic = dynamic(() => import('@/components/SignalDatePicker'), {
  ssr: false
});

export type SignalImplementationType = 'calendar' | 'static';

export interface BaseSignal {
  trigger: string;
  description: string;
  type: SignalImplementationType;
}

export interface StaticSignal extends BaseSignal {
  type: 'static';
  render: (editor: TinyMCEEditor, signalId: string) => Promise<void>;
}

export interface CalendarSignal extends BaseSignal {
  type: 'calendar';
  format?: string;
  render: (editor: TinyMCEEditor, date: Date, signalId: string) => Promise<void>;
}

export type Signal = StaticSignal | CalendarSignal;

export interface SignalHandler<T extends Signal> {
  handleSignal: (editor: TinyMCEEditor, signal: T, existingSignalId?: string) => Promise<void>;
}

// Helper to generate unique IDs for signals
const generateSignalId = () => `signal-${Math.random().toString(36).substr(2, 9)}`;

// Helper to wrap content with signal metadata
const wrapWithSignal = (content: string, signalId: string, trigger: string) => {
  return `<span class="signal-content" contenteditable="false" data-signal-id="${signalId}" data-signal-trigger="${trigger}">${content}</span>`;
};

// Helper to replace signal content
const replaceSignalContent = (editor: TinyMCEEditor, signalId: string, content: string) => {
  const existingSignal = editor.dom.select(`[data-signal-id="${signalId}"]`)[0];
  if (existingSignal) {
    editor.selection.select(existingSignal);
    editor.selection.setContent(content);
  }
};

// Helper to format relative time that updates periodically
const createRelativeTimeElement = (date: Date) => {
  return `<time 
    datetime="${date.toISOString()}" 
    title="${date.toLocaleDateString()} ${date.toLocaleTimeString()}"
    class="relative-time"
  >
    ${formatDistanceToNow(date, { addSuffix: true })}
  </time>`;
};

const staticHandler: SignalHandler<StaticSignal> = {
  handleSignal: async (editor, signal, existingSignalId) => {
    const signalId = existingSignalId || generateSignalId();
    await signal.render(editor, signalId);
  }
};

const calendarHandler: SignalHandler<CalendarSignal> = {
  handleSignal: async (editor, signal, existingSignalId) => {
    return new Promise<void>((resolve) => {
      // Create a container for our React component
      const container = document.createElement('div');
      document.body.appendChild(container);

      // Create the React root
      const { createRoot } = require('react-dom/client');
      const root = createRoot(container);

      const handleClose = () => {
        root.unmount();
        container.remove();
        resolve();
      };

      const handleConfirm = (date: Date) => {
        const signalId = existingSignalId || generateSignalId();
        if (signal.render) {
          if (existingSignalId) {
            // If we're editing an existing signal, replace its content
            const content = createRelativeTimeElement(date);
            const wrappedContent = wrapWithSignal(content, signalId, signal.trigger);
            replaceSignalContent(editor, signalId, wrappedContent);
          } else {
            // If it's a new signal, insert at cursor
            signal.render(editor, date, signalId);
          }
        }
        handleClose();
      };

      // Use dynamic import for React to avoid TypeScript JSX errors
      const React = require('react');
      const element = React.createElement(SignalDatePickerDynamic, {
        isOpen: true,
        onClose: handleClose,
        onConfirm: handleConfirm
      });

      // Render the date picker
      root.render(element);
    });
  }
};

// Map of handlers for each signal type
export const signalHandlers: {
  'static': SignalHandler<StaticSignal>;
  'calendar': SignalHandler<CalendarSignal>;
} = {
  'static': staticHandler,
  'calendar': calendarHandler
};

// Set up periodic updates for relative times
const setupUpdateInterval = (editor: TinyMCEEditor) => {
  const updateRelativeTimes = () => {
    editor.dom.select('.signal-content time.relative-time').forEach((timeElement) => {
      const date = new Date(timeElement.getAttribute('datetime') || '');
      timeElement.textContent = formatDistanceToNow(date, { addSuffix: true });
    });
  };

  // Initial update
  updateRelativeTimes();

  // Update every minute
  const updateInterval = setInterval(updateRelativeTimes, 60000);

  // Return cleanup function
  return () => clearInterval(updateInterval);
};

// Signal definitions
export const signals: Signal[] = [
  {
    trigger: '@since',
    type: 'calendar',
    description: 'Insert a relative time from a date',
    format: 'yyyy-MM-dd',
    render: async (editor, date, signalId) => {
      const content = createRelativeTimeElement(date);
      editor.insertContent(wrapWithSignal(content, signalId, '@since'));
      
      // Properly trigger NodeChange event
      editor.nodeChanged();
      
      // Immediately update the newly inserted time element
      const timeElement = editor.dom.select(`[data-signal-id="${signalId}"] time.relative-time`)[0];
      if (timeElement) {
        const date = new Date(timeElement.getAttribute('datetime') || '');
        timeElement.textContent = formatDistanceToNow(date, { addSuffix: true });
      }
    }
  }
];

export const getSignalTriggers = () => signals.map(signal => signal.trigger);

export const getSignalByTrigger = (trigger: string) => 
  signals.find(signal => signal.trigger === trigger);

export const handleSignal = async (editor: TinyMCEEditor, signal: Signal, existingSignalId?: string) => {
  const handler = signalHandlers[signal.type];
  if (handler) {
    await (handler as SignalHandler<typeof signal>).handleSignal(editor, signal, existingSignalId);
  }
};

// Setup function to initialize TinyMCE with signal interaction support
export const setupSignalInteractions = (editor: TinyMCEEditor) => {
  let cleanupInterval: (() => void) | null = null;

  // Helper function to update all time elements
  const updateAllTimeElements = () => {
    editor.dom.select('.signal-content time.relative-time').forEach((timeElement) => {
      const date = new Date(timeElement.getAttribute('datetime') || '');
      timeElement.textContent = formatDistanceToNow(date, { addSuffix: true });
    });
  };

  editor.on('init', () => {
    editor.dom.addStyle(`
      .signal-content {
        position: relative;
        border-radius: 4px;
        padding: 2px 4px;
        margin: 0 2px;
        cursor: pointer;
        display: inline-block;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }
      .signal-content:hover {
        background: rgba(74, 144, 226, 0.1);
      }
      .signal-content * {
        pointer-events: none;
      }
      .signal-content .relative-time {
        color: #4a90e2;
        font-weight: 500;
      }
      .tox-tbtn {
        margin: 0 !important;
      }
      .tox-pop {
        transform: none !important;
      }
      .tox-tbtn:hover {
        background: rgba(74, 144, 226, 0.1) !important;
      }
    `);

    // Add non-editable filter
    editor.parser.addNodeFilter('span', (nodes) => {
      nodes.forEach((node) => {
        if (node.attr('class') === 'signal-content') {
          node.attr('contenteditable', 'false');
        }
      });
    });

    // Set up initial interval
    cleanupInterval = setupUpdateInterval(editor);

    // Clean up interval on editor removal
    editor.on('remove', () => {
      if (cleanupInterval) {
        cleanupInterval();
      }
    });
  });

  // Update times when content is loaded or changed
  editor.on('LoadContent SetContent', updateAllTimeElements);

  // Listen for content changes to reinitialize interval if needed
  editor.on('NodeChange', () => {
    const hasTimeElements = editor.dom.select('.signal-content time.relative-time').length > 0;
    
    // If we have time elements but no interval, set it up
    if (hasTimeElements && !cleanupInterval) {
      cleanupInterval = setupUpdateInterval(editor);
    }
    // If we have no time elements but have an interval, clean it up
    else if (!hasTimeElements && cleanupInterval) {
      cleanupInterval();
      cleanupInterval = null;
    }
  });

  // Register the edit button
  editor.ui.registry.addButton('signal-edit', {
    icon: 'edit-block',
    tooltip: 'Edit Signal',
    onAction: () => {
      const node = editor.selection.getNode();
      const signalContent = node.closest('.signal-content');
      if (signalContent) {
        const signalId = signalContent.getAttribute('data-signal-id');
        const trigger = signalContent.getAttribute('data-signal-trigger');
        const signal = getSignalByTrigger(trigger || '');
        if (signal && signalId) {
          handleSignal(editor, signal, signalId);
        }
      }
    }
  });

  // Add context toolbar that appears on hover
  editor.ui.registry.addContextToolbar('signal-toolbar', {
    predicate: (node) => {
      const signalContent = node.closest('.signal-content');
      return signalContent !== null;
    },
    items: 'signal-edit',
    position: 'selection',
    scope: 'editor'
  });
}; 