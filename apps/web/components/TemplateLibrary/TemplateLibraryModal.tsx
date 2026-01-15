'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTemplates } from '@/context/TemplateContext';
import { useQuery } from '@/context/QueryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Search, Copy, Trash2, GitBranch, Clock, AlertCircle } from 'lucide-react';
import type { QueryTemplate } from '@crystal-forge/storage';

/**
 * Props for TemplateLibraryModal
 */
interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryFilter = 'all' | 'common' | 'ecommerce' | 'advanced' | 'custom';

/**
 * Modal for browsing and managing query templates
 */
export function TemplateLibraryModal({ isOpen, onClose }: TemplateLibraryModalProps) {
  const { state: templateState, loadAllTemplates, loadTemplatesByCategory, findTemplate, deleteTemplate, duplicateQueryTemplate, getCustomTemplates } = useTemplates();
  const { setQuery } = useQuery();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [activeTab, setActiveTab] = useState<'templates' | 'history' | 'saved'>('templates');
  const [localError, setLocalError] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      loadAllTemplates();
    }
  }, [isOpen, loadAllTemplates]);

  /**
   * Filter and search templates
   */
  const filteredTemplates = useMemo(() => {
    let templates = templateState.queryTemplates;

    // Apply category filter
    if (selectedCategory !== 'all') {
      templates = templates.filter((t) => t.category === selectedCategory);
    }

    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term) ||
          t.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    return templates;
  }, [templateState.queryTemplates, selectedCategory, searchTerm]);

  /**
   * Handle loading a template into the query builder
   */
  const handleLoadTemplate = useCallback(
    (template: QueryTemplate) => {
      try {
        setQuery(template.query.query);
        onClose();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load template';
        setLocalError(errorMessage);
      }
    },
    [setQuery, onClose]
  );

  /**
   * Handle duplicating a template
   */
  const handleDuplicateTemplate = useCallback(
    async (template: QueryTemplate) => {
      try {
        setLocalError(null);
        const newName = `${template.name} (Copy)`;
        await duplicateQueryTemplate(template.id, newName);
        await loadAllTemplates();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate template';
        setLocalError(errorMessage);
      }
    },
    [duplicateQueryTemplate, loadAllTemplates]
  );

  /**
   * Handle deleting a custom template
   */
  const handleDeleteTemplate = useCallback(
    async (template: QueryTemplate) => {
      if (!confirm(`Delete template "${template.name}"?`)) {
        return;
      }
      try {
        setLocalError(null);
        await deleteTemplate(template.id);
        await loadAllTemplates();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete template';
        setLocalError(errorMessage);
      }
    },
    [deleteTemplate, loadAllTemplates]
  );

  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      if (value.trim()) {
        // Could implement debounced search here if needed
      }
    },
    []
  );

  /**
   * Handle category filter change
   */
  const handleCategoryChange = useCallback((category: CategoryFilter) => {
    setSelectedCategory(category);
    if (category !== 'all') {
      loadTemplatesByCategory(category as string);
    } else {
      loadAllTemplates();
    }
  }, [loadTemplatesByCategory, loadAllTemplates]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Query Template Library</DialogTitle>
          <DialogDescription>
            Browse, search, and load pre-built query templates or manage your query history
          </DialogDescription>
        </DialogHeader>

        {/* Error Message */}
        {(localError || templateState.error) && (
          <div className="flex items-start gap-3 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{localError || templateState.error}</div>
            <button
              onClick={() => {
                setLocalError(null);
              }}
              className="text-red-600 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'templates' | 'history' | 'saved')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {(['all', 'common', 'ecommerce', 'advanced', 'custom'] as const).map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Loading State */}
            {templateState.isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              </div>
            )}

            {/* Templates Grid */}
            {!templateState.isLoading && filteredTemplates.length === 0 && (
              <div className="rounded-md bg-gray-50 p-8 text-center">
                <p className="text-gray-600">
                  {searchTerm ? 'No templates found matching your search.' : 'No templates available.'}
                </p>
              </div>
            )}

            {!templateState.isLoading && filteredTemplates.length > 0 && (
              <div className="grid gap-3 max-h-[calc(90vh-300px)] overflow-y-auto pr-2">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onLoad={handleLoadTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <div className="rounded-md bg-gray-50 p-8 text-center">
              <Clock className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600">Query history coming soon</p>
            </div>
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="space-y-4">
            <div className="rounded-md bg-gray-50 p-8 text-center">
              <p className="text-gray-600">Custom saved templates will appear here</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Individual template card component
 */
interface TemplateCardProps {
  template: QueryTemplate;
  onLoad: (template: QueryTemplate) => void;
  onDuplicate: (template: QueryTemplate) => void;
  onDelete: (template: QueryTemplate) => void;
}

function TemplateCard({ template, onLoad, onDuplicate, onDelete }: TemplateCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
            {template.isBuiltIn && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                Built-in
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{template.description}</p>
          {template.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onLoad(template)}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            title="Load this template"
          >
            Load
          </button>
          <button
            onClick={() => onDuplicate(template)}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            title="Duplicate this template"
          >
            <GitBranch className="h-4 w-4" />
          </button>
          {!template.isBuiltIn && (
            <button
              onClick={() => onDelete(template)}
              className="inline-flex items-center justify-center rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              title="Delete this template"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
