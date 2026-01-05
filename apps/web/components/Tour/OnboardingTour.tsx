'use client';

import { useCallback, useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { ONBOARDING_TOUR_STEPS } from '@/constants/tour-steps';

/**
 * Hook for managing the onboarding tour
 * Provides functions to start the tour and check completion status
 */
export function useOnboardingTour() {
  /**
   * Start the onboarding tour
   */
  const startTour = useCallback(() => {
    let driverObj: any = null;

    // ESC key handler
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && driverObj) {
        driverObj.destroy();
      }
    };

    const config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: ONBOARDING_TOUR_STEPS,
      onCloseClick: () => {
        if (driverObj) {
          driverObj.destroy();
        }
      },
      onDestroyStarted: () => {
        // Mark tour as completed in localStorage
        localStorage.setItem('crystal-forge:tour-completed', 'true');
      },
      onDestroy: () => {
        // Clean up event listeners
        document.removeEventListener('keydown', handleEsc);
      },
      allowClose: true,
      smoothScroll: true,
    };

    driverObj = driver(config);

    document.addEventListener('keydown', handleEsc);
    driverObj.drive();
  }, []);

  /**
   * Check if user has completed the tour before
   */
  const hasTourCompleted = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('crystal-forge:tour-completed') === 'true';
  }, []);

  /**
   * Reset tour completion status (for re-running the tour)
   */
  const resetTourCompletion = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('crystal-forge:tour-completed');
  }, []);

  return { startTour, hasTourCompleted, resetTourCompletion };
}
