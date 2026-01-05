'use client';

import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface InfoTooltipProps {
  content: {
    title?: string;
    description: string;
    examples?: string[];
    sqlEquivalent?: string;
    whenToUse?: string;
    learnMoreUrl?: string;
  };
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
  children?: React.ReactNode;
}

/**
 * InfoTooltip component for displaying contextual help
 * Wraps content in a styled tooltip with an info icon
 */
export const InfoTooltip = React.forwardRef<
  HTMLButtonElement,
  InfoTooltipProps
>(
  (
    {
      content,
      className,
      side = 'right',
      delayDuration = 300,
      children,
    }: InfoTooltipProps,
    ref
  ) => {
    return (
      <TooltipProvider delayDuration={delayDuration}>
        <Tooltip>
          <TooltipTrigger asChild>
            {children ? (
              <div>{children}</div>
            ) : (
              <button
                ref={ref}
                className={cn(
                  'inline-flex items-center justify-center',
                  'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                  'transition-colors duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
                  'rounded p-0.5',
                  className
                )}
                aria-label="More information"
                type="button"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent
            side={side}
            className="max-w-sm p-3 text-sm bg-gray-900 dark:bg-gray-950 text-white border border-gray-700 rounded-md shadow-lg space-y-2 z-50"
          >
            {content.title && (
              <div className="font-semibold text-indigo-200">{content.title}</div>
            )}

            <div className="text-gray-100">{content.description}</div>

            {content.examples && content.examples.length > 0 && (
              <div className="text-xs text-gray-300 space-y-1">
                <div className="font-medium">Examples:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {content.examples.map((example) => (
                    <li key={example}>{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {content.sqlEquivalent && (
              <div className="text-xs bg-gray-800 p-2 rounded font-mono text-gray-200 border border-gray-700">
                <span className="text-gray-400">SQL:</span> {content.sqlEquivalent}
              </div>
            )}

            {content.whenToUse && (
              <div className="text-xs text-gray-300 pt-1 border-t border-gray-700">
                <span className="text-indigo-200 font-medium">When to use:</span>{' '}
                {content.whenToUse}
              </div>
            )}

            {content.learnMoreUrl && (
              <a
                href={content.learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-indigo-300 hover:text-indigo-200 underline pt-1"
              >
                Learn more in docs →
              </a>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

InfoTooltip.displayName = 'InfoTooltip';
