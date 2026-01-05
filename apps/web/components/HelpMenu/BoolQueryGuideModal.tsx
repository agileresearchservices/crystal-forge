'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BoolQueryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BoolQueryGuideModal({ isOpen, onClose }: BoolQueryGuideModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bool Query Guide</DialogTitle>
          <DialogDescription>
            Understand how to structure complex queries with bool clauses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Must Clause */}
          <div className="space-y-2 pb-4 border-b">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-mono bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                MUST
              </span>
              <h3 className="font-semibold">Must Clause (AND)</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              All conditions in the must clause must match. Results are ranked by relevance score.
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <strong>SQL Equivalent:</strong> WHERE condition1 AND condition2
              </p>
              <p>
                <strong>When to use:</strong> When you want to search for documents that match all your criteria
                and you care about which results are most relevant.
              </p>
              <p>
                <strong>Example:</strong> Find all blog posts about "Python" AND "machine learning" (ranked by
                relevance)
              </p>
            </div>
          </div>

          {/* Should Clause */}
          <div className="space-y-2 pb-4 border-b">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                SHOULD
              </span>
              <h3 className="font-semibold">Should Clause (OR)</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              At least one condition should match. Boosts relevance score if multiple conditions match.
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <strong>SQL Equivalent:</strong> WHERE condition1 OR condition2
              </p>
              <p>
                <strong>When to use:</strong> When you want to find documents matching any of your criteria,
                with higher relevance for documents matching more conditions.
              </p>
              <p>
                <strong>Example:</strong> Find documents about "Python" OR "JavaScript" (either is good, both is
                better)
              </p>
            </div>
          </div>

          {/* Must Not Clause */}
          <div className="space-y-2 pb-4 border-b">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-mono bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded">
                MUST NOT
              </span>
              <h3 className="font-semibold">Must Not Clause (NOT)</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Excludes documents matching the conditions. Does not affect scoring.
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <strong>SQL Equivalent:</strong> WHERE NOT condition
              </p>
              <p>
                <strong>When to use:</strong> When you want to exclude certain documents from your results.
              </p>
              <p>
                <strong>Example:</strong> Find articles about "sports" but NOT about "football"
              </p>
            </div>
          </div>

          {/* Filter Clause */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                FILTER
              </span>
              <h3 className="font-semibold">Filter Clause (Fast AND)</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              All conditions must match but NO scoring. Faster and cached by OpenSearch.
            </p>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p>
                <strong>SQL Equivalent:</strong> WHERE condition1 AND condition2 (no ranking)
              </p>
              <p>
                <strong>When to use:</strong> For yes/no filtering that doesn't affect relevance, like status,
                categories, or date ranges.
              </p>
              <p>
                <strong>Example:</strong> Filter for products with status="active" AND price between $10-$50
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Tips</h4>
            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use filter for structured data (status, categories, date ranges) when you don't need scoring</li>
              <li>• Use must for text search where relevance ranking matters</li>
              <li>• Combine must + filter for best performance: search in must, filter in filter</li>
              <li>• Use should with minimum_should_match=1 to require at least one condition</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
