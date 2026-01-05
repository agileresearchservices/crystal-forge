'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QueryPatternsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUERY_PATTERNS = [
  {
    name: 'Simple Text Search',
    description: 'Search for keywords in text fields',
    useCase: 'Product search, content discovery, blog search',
    example: 'Search for "laptop" in product names and descriptions',
    tips: ['Use match query for text fields', 'Supports typos and word variations'],
  },
  {
    name: 'Exact Phrase Search',
    description: 'Find documents with exact phrase in order',
    useCase: 'Finding exact quotes, brand names, specific phrases',
    example: 'Search for the exact phrase "machine learning" in articles',
    tips: ['Use match_phrase query', 'Word order matters', 'More restrictive than match'],
  },
  {
    name: 'Numeric Range Filtering',
    description: 'Find documents within numeric ranges',
    useCase: 'Price filtering, age ranges, quantity ranges',
    example: 'Find products with price between $50 and $200',
    tips: ['Use range query', 'Works with any numeric field', 'Very fast for filtering'],
  },
  {
    name: 'Date Range Filtering',
    description: 'Find documents within date ranges',
    useCase: 'Recent articles, events in date range, historical data',
    example: 'Find articles created in the last 7 days',
    tips: ['Use range query with dates', 'Supports date math (now-7d)', 'Can use relative dates'],
  },
  {
    name: 'Exclude Documents',
    description: 'Find documents NOT matching a condition',
    useCase: 'Remove spam, filter out categories, exclude tags',
    example: 'Find articles about sports but NOT football',
    tips: ['Use must_not clause', 'Does not affect scoring', 'Good for negative filters'],
  },
  {
    name: 'Combined Search & Filter',
    description: 'Search with relevance + filter by attributes',
    useCase: 'Most common: full-text search + category/status filters',
    example: 'Search for "laptop" in product names + filter by category="electronics" + price < $1000',
    tips: ['Use must for search (affects relevance)', 'Use filter for attributes (faster)', 'Best performance pattern'],
  },
  {
    name: 'Category/Tag Filtering',
    description: 'Find documents with specific category or tags',
    useCase: 'Filter by product type, content category, status',
    example: 'Find all products in category="laptops" with status="active"',
    tips: ['Use term query for keyword fields', 'Use filter for multiple conditions', 'Very fast lookups'],
  },
  {
    name: 'Autocomplete/Search-as-you-type',
    description: 'Match prefix of text as user types',
    useCase: 'Search boxes, autocomplete suggestions',
    example: 'As user types "mac", find "MacBook", "Macbook Pro", etc.',
    tips: ['Use match_phrase_prefix query', 'Last word is prefix-matched', 'Fast for suggestions'],
  },
  {
    name: 'Fuzzy Matching',
    description: 'Match with typo tolerance',
    useCase: 'Handling misspellings, fuzzy search',
    example: 'Search for "lapto" still finds "laptop" products',
    tips: ['Use fuzzy query', 'Handles typos automatically', 'Can specify max edit distance'],
  },
  {
    name: 'OR Logic (Any Match)',
    description: 'Find documents matching any of multiple conditions',
    useCase: 'Find articles about "Python" OR "JavaScript"',
    example: 'Search results should be relevant to either language',
    tips: ['Use should clause', 'Higher relevance if multiple conditions match', 'Good for alternatives'],
  },
];

export function QueryPatternsModal({ isOpen, onClose }: QueryPatternsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Common Query Patterns</DialogTitle>
          <DialogDescription>
            Learn from common search patterns used in production applications
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {QUERY_PATTERNS.map((pattern) => (
            <div
              key={pattern.name}
              className="space-y-2 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900"
            >
              <div>
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{pattern.name}</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{pattern.description}</p>
              </div>

              <div className="space-y-1 text-xs">
                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Use Case:</strong>
                  <p className="text-gray-600 dark:text-gray-400">{pattern.useCase}</p>
                </div>

                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Example:</strong>
                  <p className="text-gray-600 dark:text-gray-400">{pattern.example}</p>
                </div>

                <div>
                  <strong className="text-gray-700 dark:text-gray-300">Tips:</strong>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-0.5">
                    {pattern.tips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}

          {/* Best Practices */}
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800 mt-6">
            <h4 className="font-semibold text-sm text-green-900 dark:text-green-100 mb-2">
              General Best Practices
            </h4>
            <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
              <li>
                • Start simple: try full-text search first, then add filters as needed
              </li>
              <li>
                • Use filter clause for structured data (category, status, price range) - it's faster and cached
              </li>
              <li>
                • Use must clause for text search where relevance ranking matters
              </li>
              <li>
                • Combine them: search in must, filter in filter for best performance and relevance
              </li>
              <li>
                • Test your queries with real data to verify they return expected results
              </li>
              <li>
                • Monitor slow queries in your OpenSearch cluster and optimize field mappings
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
