'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const DATE_MATH_EXAMPLES = [
  { label: 'Now', value: 'now' },
  { label: '7 days ago', value: 'now-7d' },
  { label: '1 hour ago', value: 'now-1h' },
  { label: '30 days from now', value: 'now+30d' },
  { label: 'Start of today', value: 'now/d' },
  { label: 'Start of month', value: 'now/M' },
  { label: 'Start of year', value: 'now/y' },
];

interface DateMathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * Date math input component
 * Allows users to enter OpenSearch date math expressions (e.g., "now-7d")
 * Includes helpful examples and syntax guide
 */
export function DateMathInput({
  value,
  onChange,
  placeholder = 'e.g., now-7d, now+1h',
}: DateMathInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-2 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" title="Date math examples">
              <HelpCircle className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" side="top" align="end">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Date Math Expressions:</p>
              <div className="space-y-1">
                {DATE_MATH_EXAMPLES.map((example) => (
                  <button
                    key={example.value}
                    onClick={() => {
                      onChange(example.value);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                  >
                    <code className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                      {example.value}
                    </code>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">- {example.label}</span>
                  </button>
                ))}
              </div>

              {/* Syntax help */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                <p className="text-xs font-semibold text-gray-900 dark:text-white">Syntax:</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <code className="text-indigo-600 dark:text-indigo-400">now</code> + operator + value + unit
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Units:</strong> y (year), M (month), w (week), d (day), h (hour), m (minute), s (second)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Rounding:</strong> /y /M /d /h rounds to start of unit
                </p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
