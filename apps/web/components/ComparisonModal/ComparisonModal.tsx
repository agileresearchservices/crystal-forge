'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QUERY_COMPARISONS } from '@/constants/query-comparisons';

interface ComparisonModalProps {
  comparisonKey: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ComparisonModal({ comparisonKey, isOpen, onClose }: ComparisonModalProps) {
  if (!comparisonKey || !(comparisonKey in QUERY_COMPARISONS)) {
    return null;
  }

  const comparison = QUERY_COMPARISONS[comparisonKey];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{comparison.title}</DialogTitle>
          <DialogDescription>{comparison.description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {comparison.items.map((item) => (
            <div
              key={item.type}
              className="space-y-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900"
            >
              {/* Header with type badge */}
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs font-mono bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded whitespace-nowrap">
                  {item.type}
                </span>
                <h3 className="font-semibold text-gray-900 dark:text-white">{item.label}</h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>

              {/* Detailed sections */}
              <div className="space-y-2 text-xs">
                {/* Example */}
                <div>
                  <strong className="text-gray-900 dark:text-white block mb-1">Example:</strong>
                  <p className="text-gray-600 dark:text-gray-400">{item.example}</p>
                </div>

                {/* Behavior */}
                <div>
                  <strong className="text-gray-900 dark:text-white block mb-1">Behavior:</strong>
                  <p className="text-gray-600 dark:text-gray-400">{item.behavior}</p>
                </div>

                {/* Best For */}
                <div>
                  <strong className="text-gray-900 dark:text-white block mb-1">Best For:</strong>
                  <p className="text-gray-600 dark:text-gray-400">{item.bestFor}</p>
                </div>

                {/* Performance (if available) */}
                {item.performance && (
                  <div>
                    <strong className="text-gray-900 dark:text-white block mb-1">
                      Performance:
                    </strong>
                    <p className="text-gray-600 dark:text-gray-400">{item.performance}</p>
                  </div>
                )}

                {/* SQL Equivalent (if available) */}
                {item.sqlEquivalent && (
                  <div>
                    <strong className="text-gray-900 dark:text-white block mb-1">
                      SQL Equivalent:
                    </strong>
                    <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-800 dark:text-gray-200 overflow-x-auto">
                      {item.sqlEquivalent}
                    </code>
                  </div>
                )}

                {/* When to Use */}
                {item.whenToUse && item.whenToUse.length > 0 && (
                  <div>
                    <strong className="text-gray-900 dark:text-white block mb-1">When to Use:</strong>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-0.5">
                      {item.whenToUse.map((use, index) => (
                        <li key={index}>{use}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
