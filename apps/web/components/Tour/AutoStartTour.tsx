'use client';

import { useEffect } from 'react';
import { useOnboardingTour } from './OnboardingTour';
import { useConnection } from '@/context/ConnectionContext';

/**
 * Component that automatically starts the onboarding tour for first-time users
 * Waits 2 seconds before starting the tour to ensure UI is fully loaded
 * Only triggers if:
 * - User hasn't completed the tour before
 * - User is not already connected to OpenSearch
 */
export function AutoStartTour() {
  const { startTour, hasTourCompleted } = useOnboardingTour();
  const { state: connectionState } = useConnection();

  useEffect(() => {
    // Don't auto-start if tour already completed or user is connected
    if (hasTourCompleted() || connectionState.connection.isConnected) {
      return;
    }

    // Wait 2 seconds after page load to let UI settle, then start tour
    const tourTimeout = setTimeout(() => {
      startTour();
    }, 2000);

    return () => clearTimeout(tourTimeout);
  }, [startTour, hasTourCompleted, connectionState.connection.isConnected]);

  // This component doesn't render anything
  return null;
}
