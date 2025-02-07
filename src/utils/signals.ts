import { Editor as TinyMCEEditor } from 'tinymce';
import { formatDistanceToNow } from 'date-fns';

export type SignalImplementationType = 'text-input' | 'calendar' | 'static';

export interface BaseSignal {
  trigger: string;
  description: string;
  type: SignalImplementationType;
}

export interface StaticSignal extends BaseSignal {
  type: 'static';
  render: (editor: TinyMCEEditor, signalId: string) => Promise<void>;
}

export interface TextInputSignal extends BaseSignal {
  type: 'text-input';
  placeholder?: string;
  defaultValue?: string;
  label: string;
  render: (editor: TinyMCEEditor, value: string, signalId: string) => Promise<void>;
}

export interface CalendarSignal extends BaseSignal {
  type: 'calendar';
  format?: string;
  render: (editor: TinyMCEEditor, date: Date, signalId: string) => Promise<void>;
}

export type Signal = StaticSignal | TextInputSignal | CalendarSignal;

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
    title="${date.toLocaleDateString()}"
    class="relative-time"
  >
    ${formatDistanceToNow(date, { addSuffix: true })}
  </time>`;
};

// Signal Handlers
const textInputHandler: SignalHandler<TextInputSignal> = {
  handleSignal: async (editor, signal, existingSignalId) => {
    const value = prompt(signal.label, signal.defaultValue || '');
    if (value !== null) {
      const signalId = existingSignalId || generateSignalId();
      if (existingSignalId) {
        // If we're editing an existing signal, replace its content
        const formattedGreeting = `<div class="greeting">
          <span style="font-weight: bold; color: #4a90e2;">${value}</span>
          <span style="font-size: 1.2em;">👋</span>
        </div>`;
        const wrappedContent = wrapWithSignal(formattedGreeting, signalId, signal.trigger);
        replaceSignalContent(editor, signalId, wrappedContent);
      } else {
        // If it's a new signal, insert at cursor
        await signal.render(editor, value, signalId);
      }
    }
  }
};

const staticHandler: SignalHandler<StaticSignal> = {
  handleSignal: async (editor, signal, existingSignalId) => {
    const signalId = existingSignalId || generateSignalId();
    await signal.render(editor, signalId);
  }
};

const calendarHandler: SignalHandler<CalendarSignal> = {
  handleSignal: async (editor, signal, existingSignalId) => {
    // Create a date picker dialog
    return new Promise<void>((resolve) => {
      const dialog = editor.windowManager.open({
        title: 'Select Date',
        body: {
          type: 'panel',
          items: [
            {
              type: 'htmlpanel',
              html: '<div style="margin-bottom: 8px;">Select a date to calculate time elapsed since then:</div>'
            },
            {
              type: 'bar',
              items: [
                {
                  type: 'input',
                  name: 'date',
                  label: 'Date',
                  inputMode: 'text',
                },
                {
                  type: 'button',
                  text: 'Today',
                  buttonType: 'secondary',
                  name: 'today-button'
                }
              ]
            }
          ]
        },
        initialData: {
          date: new Date().toISOString().split('T')[0]
        },
        size: 'normal',
        buttons: [
          {
            type: 'cancel',
            text: 'Cancel'
          },
          {
            type: 'submit',
            text: 'OK',
            primary: true
          }
        ],
        onAction: (api, details) => {
          if (details.name === 'today-button') {
            api.setData({ date: new Date().toISOString().split('T')[0] });
          }
        },
        onSubmit: (api) => {
          const data = api.getData();
          const selectedDate = new Date(data.date);
          const signalId = existingSignalId || generateSignalId();
          
          if (signal.render) {
            signal.render(editor, selectedDate, signalId);
          }
          
          api.close();
          resolve();
        },
        onCancel: () => {
          resolve();
        }
      });

      // Make the input a date type after dialog is rendered
      setTimeout(() => {
        const input = document.querySelector('.tox-dialog input[type="text"]');
        if (input instanceof HTMLInputElement) {
          input.type = 'date';
          input.style.minWidth = '200px';
        }
      }, 100);
    });
  }
};

// Map of handlers for each signal type
export const signalHandlers: {
  'text-input': SignalHandler<TextInputSignal>;
  'static': SignalHandler<StaticSignal>;
  'calendar': SignalHandler<CalendarSignal>;
} = {
  'text-input': textInputHandler,
  'static': staticHandler,
  'calendar': calendarHandler
};

// Signal definitions
export const signals: Signal[] = [
  {
    trigger: '@hello',
    type: 'text-input',
    description: 'Insert a custom greeting',
    label: 'Enter your greeting message:',
    placeholder: 'Hello World!',
    defaultValue: 'Hello ',
    render: async (editor, value, signalId) => {
      const formattedGreeting = `<div class="greeting">
        <span style="font-weight: bold; color: #4a90e2;">${value}</span>
        <span style="font-size: 1.2em;">👋</span>
      </div>`;
      editor.insertContent(wrapWithSignal(formattedGreeting, signalId, '@hello'));
    }
  },
  {
    trigger: '@since',
    type: 'calendar',
    description: 'Insert a relative time from a date',
    format: 'yyyy-MM-dd',
    render: async (editor, date, signalId) => {
      const content = createRelativeTimeElement(date);
      editor.insertContent(wrapWithSignal(content, signalId, '@since'));
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
  // Add custom CSS for signal styling
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

    // Set up periodic updates for relative times
    const updateRelativeTimes = () => {
      editor.dom.select('.signal-content time.relative-time').forEach((timeElement) => {
        const date = new Date(timeElement.getAttribute('datetime') || '');
        timeElement.textContent = formatDistanceToNow(date, { addSuffix: true });
      });
    };

    // Update relative times every minute
    const updateInterval = setInterval(updateRelativeTimes, 60000);

    // Clean up interval on editor removal
    editor.on('remove', () => {
      clearInterval(updateInterval);
    });
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