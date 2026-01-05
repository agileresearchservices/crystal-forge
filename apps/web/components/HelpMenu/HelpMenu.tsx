'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { HelpCircle, Keyboard, ExternalLink, Book, FileText, MapPin, Route } from 'lucide-react';
import { useOnboardingTour } from '@/components/Tour/OnboardingTour';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { BoolQueryGuideModal } from './BoolQueryGuideModal';
import { FieldTypesGuideModal } from './FieldTypesGuideModal';
import { QueryPatternsModal } from './QueryPatternsModal';

export function HelpMenu() {
  const { startTour } = useOnboardingTour();
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showBoolGuide, setShowBoolGuide] = useState(false);
  const [showFieldTypesGuide, setShowFieldTypesGuide] = useState(false);
  const [showQueryPatterns, setShowQueryPatterns] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="default">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end">
          <DropdownMenuItem onClick={() => startTour()}>
            <Route className="mr-2 w-4 h-4" />
            <span>Take a Tour</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowKeyboardShortcuts(true)}>
            <Keyboard className="mr-2 w-4 h-4" />
            <span>Keyboard Shortcuts</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a
              href="https://opensearch.org/docs/latest/query-dsl/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 w-4 h-4" />
              <span>OpenSearch Query DSL Docs</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowBoolGuide(true)}>
            <Book className="mr-2 w-4 h-4" />
            <span>Bool Query Guide</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowFieldTypesGuide(true)}>
            <FileText className="mr-2 w-4 h-4" />
            <span>Field Types Reference</span>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowQueryPatterns(true)}>
            <MapPin className="mr-2 w-4 h-4" />
            <span>Common Query Patterns</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <KeyboardShortcutsModal
        isOpen={showKeyboardShortcuts}
        onClose={() => setShowKeyboardShortcuts(false)}
      />
      <BoolQueryGuideModal
        isOpen={showBoolGuide}
        onClose={() => setShowBoolGuide(false)}
      />
      <FieldTypesGuideModal
        isOpen={showFieldTypesGuide}
        onClose={() => setShowFieldTypesGuide(false)}
      />
      <QueryPatternsModal
        isOpen={showQueryPatterns}
        onClose={() => setShowQueryPatterns(false)}
      />
    </>
  );
}

export default HelpMenu;
