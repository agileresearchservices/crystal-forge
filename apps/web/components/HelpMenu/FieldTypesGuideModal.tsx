'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface FieldTypesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_TYPES = [
  {
    name: 'Text',
    description: 'Analyzed text for full-text search (lowercased, tokenized, stemmed)',
    recommendedOperator: 'match',
    examples: ['Product names', 'Descriptions', 'Blog posts', 'Comments'],
  },
  {
    name: 'Keyword',
    description: 'Exact values not analyzed (case-sensitive, exact matching)',
    recommendedOperator: 'term',
    examples: ['Order IDs', 'Tags', 'Categories', 'Status codes'],
  },
  {
    name: 'Long / Integer / Short / Byte',
    description: 'Numeric integer values',
    recommendedOperator: 'range',
    examples: ['Prices', 'Quantities', 'Ages', 'Counts'],
  },
  {
    name: 'Double / Float / Half Float / Scaled Float',
    description: 'Numeric floating-point values',
    recommendedOperator: 'range',
    examples: ['Ratings', 'Percentages', 'Decimals'],
  },
  {
    name: 'Date',
    description: 'Date and timestamp values (ISO 8601 format)',
    recommendedOperator: 'range',
    examples: ['Created dates', 'Updated dates', 'Timestamps'],
  },
  {
    name: 'Boolean',
    description: 'True/false values',
    recommendedOperator: 'term',
    examples: ['Is active', 'Is published', 'Is featured'],
  },
  {
    name: 'IP',
    description: 'IP addresses (IPv4 or IPv6)',
    recommendedOperator: 'term',
    examples: ['Client IPs', 'Server addresses'],
  },
  {
    name: 'Geo Point',
    description: 'Geographic coordinates (latitude, longitude)',
    recommendedOperator: 'term',
    examples: ['Store locations', 'Event venues', 'User coordinates'],
  },
  {
    name: 'Nested',
    description: 'Objects that can be queried independently',
    recommendedOperator: 'nested',
    examples: ['Array of objects', 'Complex structures'],
  },
];

export function FieldTypesGuideModal({ isOpen, onClose }: FieldTypesGuideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Field Types Reference</DialogTitle>
          <DialogDescription>
            Understand the different field types and which operators work best with each
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {FIELD_TYPES.map((fieldType) => (
            <div
              key={fieldType.name}
              className="space-y-2 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {fieldType.name}
                </h4>
                <span className="px-2 py-0.5 text-xs font-mono bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded">
                  {fieldType.recommendedOperator}
                </span>
              </div>

              <p className="text-xs text-gray-700 dark:text-gray-300">{fieldType.description}</p>

              <div>
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 mb-1">
                  Examples:
                </p>
                <div className="flex flex-wrap gap-1">
                  {fieldType.examples.map((example) => (
                    <span
                      key={example}
                      className="text-xs bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-6">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Tips</h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>
                • <strong>Text fields</strong> are analyzed: "Quick Brown Fox" matches "quick", "brown", "foxes"
              </li>
              <li>
                • <strong>Keyword fields</strong> are not analyzed: "ORDER-12345" only matches exactly "ORDER-12345"
              </li>
              <li>
                • <strong>Numeric fields</strong> support range queries: find values between min and max
              </li>
              <li>
                • <strong>Date fields</strong> support date math: "now-7d" means 7 days ago, "now/d" means start of
                today
              </li>
              <li>
                • <strong>Nested fields</strong> allow querying arrays of objects as independent documents
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
