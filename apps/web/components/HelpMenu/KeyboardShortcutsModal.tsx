'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Tab'], description: 'Navigate through fields and controls' },
  { keys: ['Shift', 'Tab'], description: 'Navigate backwards' },
  { keys: ['Enter'], description: 'Add selected field to query' },
  { keys: ['Escape'], description: 'Close modals or cancel actions' },
  { keys: ['Ctrl', 'Enter'], description: 'Execute query' },
  { keys: ['Arrow Keys'], description: 'Resize panels (when focused on divider)' },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Navigate Crystal Forge efficiently using these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.keys.join('+')} className="flex items-start justify-between gap-4">
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">
                {shortcut.description}
              </span>
              <div className="flex gap-1 flex-shrink-0">
                {shortcut.keys.map((key) => (
                  <kbd
                    key={key}
                    className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow-sm whitespace-nowrap"
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
