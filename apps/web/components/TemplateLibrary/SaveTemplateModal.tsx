'use client';

import React, { useState, useCallback } from 'react';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Props for SaveTemplateModal
 */
interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TemplateCategory = 'common' | 'ecommerce' | 'advanced' | 'custom';

/**
 * Modal for saving the current query as a template
 */
export function SaveTemplateModal({ isOpen, onClose }: SaveTemplateModalProps) {
  const { state: templateState, saveCurrentQuery } = useTemplates();
  const { state: queryState } = useQuery();

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('custom');
  const [templateTags, setTemplateTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Validate form inputs
   */
  const validateForm = useCallback((): boolean => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return false;
    }
    if (templateName.trim().length < 3) {
      setError('Template name must be at least 3 characters');
      return false;
    }
    return true;
  }, [templateName]);

  /**
   * Handle form submission
   */
  const handleSaveTemplate = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(false);

      // Parse tags
      const tags = templateTags
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Save template
      await saveCurrentQuery(
        queryState.query,
        templateName.trim(),
        templateDescription.trim(),
        selectedCategory,
        tags
      );

      setSuccess(true);

      // Reset form after 1 second and close
      setTimeout(() => {
        setTemplateName('');
        setTemplateDescription('');
        setTemplateTags('');
        setSelectedCategory('custom');
        onClose();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
      setIsSubmitting(false);
    }
  }, [validateForm, saveCurrentQuery, queryState.query, templateName, templateDescription, templateTags, selectedCategory, onClose]);

  /**
   * Handle modal close
   */
  const handleClose = useCallback(() => {
    setTemplateName('');
    setTemplateDescription('');
    setTemplateTags('');
    setSelectedCategory('custom');
    setError(null);
    setSuccess(false);
    onClose();
  }, [onClose]);

  /**
   * Handle Enter key to submit
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        handleSaveTemplate();
      }
    },
    [handleSaveTemplate]
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
          <DialogDescription>
            Save your current query as a template for future use
          </DialogDescription>
        </DialogHeader>

        {/* Success Message */}
        {success && (
          <div className="flex items-start gap-3 rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200">
            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>Template saved successfully!</div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <div className="space-y-4" onKeyDown={handleKeyDown}>
            {/* Template Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Template Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Product Price Search"
                value={templateName}
                onChange={(e) => {
                  setTemplateName(e.target.value);
                  setError(null);
                }}
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Template Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                placeholder="Describe what this template does..."
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                disabled={isSubmitting}
                className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as TemplateCategory)} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tags</label>
              <Input
                placeholder="Separate tags with commas, e.g., search, filter, price"
                value={templateTags}
                onChange={(e) => setTemplateTags(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Tags help you find templates later. Optional.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={isSubmitting || !templateName.trim() || success}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSubmitting ? 'Saving...' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
