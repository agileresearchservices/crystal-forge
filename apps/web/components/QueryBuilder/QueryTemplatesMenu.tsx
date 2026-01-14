'use client';

import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QUERY_TEMPLATES, type QueryTemplate } from '@/constants/query-templates';
import { cn } from '@/lib/utils';
import {
  Search,
  Tag,
  Sliders,
  GitBranch,
  Boxes,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Search: <Search className="w-5 h-5" />,
  Tag: <Tag className="w-5 h-5" />,
  Sliders: <Sliders className="w-5 h-5" />,
  GitBranch: <GitBranch className="w-5 h-5" />,
  Boxes: <Boxes className="w-5 h-5" />,
};

interface QueryTemplatesMenuProps {
  onSelectTemplate: (template: QueryTemplate) => void;
}

/**
 * Quick-start menu for selecting query templates by type
 * Helps developers think query-first instead of field-first
 */
export function QueryTemplatesMenu({ onSelectTemplate }: QueryTemplatesMenuProps) {
  const [expanded, setExpanded] = useState(false);

  const handleSelectTemplate = useCallback(
    (template: QueryTemplate) => {
      onSelectTemplate(template);
      setExpanded(false);
    },
    [onSelectTemplate]
  );

  const categories = ['Basic', 'Filtering', 'Advanced'] as const;

  return (
    <div className="w-full py-6 px-4 border-t border-gray-200 dark:border-gray-800 mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Start with a Query Type</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Pick a query type to get started
          </p>
        </div>
      </div>

      {/* Collapsed view - show basic templates */}
      {!expanded && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUERY_TEMPLATES.filter((t) => t.category === 'Basic').map((template) => (
              <TemplateButton
                key={template.id}
                template={template}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>
          <button
            onClick={() => setExpanded(true)}
            className="w-full text-center py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            + Show more query types
          </button>
        </div>
      )}

      {/* Expanded view - show all templates grouped by category */}
      {expanded && (
        <div className="space-y-5">
          {categories.map((category) => {
            const templates = QUERY_TEMPLATES.filter((t) => t.category === category);
            if (templates.length === 0) return null;

            return (
              <div key={category}>
                <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  {category}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {templates.map((template) => (
                    <TemplateButton
                      key={template.id}
                      template={template}
                      onSelect={handleSelectTemplate}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setExpanded(false)}
            className="w-full text-center py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            − Show less
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Individual template button
 */
interface TemplateButtonProps {
  template: QueryTemplate;
  onSelect: (template: QueryTemplate) => void;
}

function TemplateButton({ template, onSelect }: TemplateButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => onSelect(template)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg text-left',
              'border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
              'hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
              'transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
            )}
            aria-label={`Create ${template.title} query: ${template.description}`}
          >
            <div className="flex-shrink-0 text-indigo-600 dark:text-indigo-400">
              {ICON_MAP[template.icon] || <Search className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">
                {template.title}
              </h5>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                {template.description}
              </p>
            </div>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs text-sm">
          <p>{template.helpText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
