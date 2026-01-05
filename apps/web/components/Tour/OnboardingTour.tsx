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

    const config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      steps: ONBOARDING_TOUR_STEPS,
      onDestroyStarted: () => {
        // Mark tour as completed in localStorage
        localStorage.setItem('crystal-forge:tour-completed', 'true');
      },
      onDestroy: () => {
        // Clean up
        console.log('Tour closed');
      },
      onStepChange: (element: any) => {
        // Add handler for close button on final step
        if (driverObj && driverObj.isLastStep && driverObj.isLastStep()) {
          setTimeout(() => {
            const closeBtn = document.querySelector(
              '.driver-close-btn, button.driver-close, [aria-label="Close"]'
            ) as HTMLButtonElement;
            if (closeBtn && !closeBtn.dataset.tourHandled) {
              closeBtn.dataset.tourHandled = 'true';
              closeBtn.addEventListener('click', () => {
                if (driverObj) driverObj.destroy();
              });
            }
          }, 50);
        }
      },
      allowClose: true,
      smoothScroll: true,
    };

    driverObj = driver(config);
    driverObj.drive();

    // Also ensure ESC key closes the tour
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && driverObj) {
        driverObj.destroy();
      }
    };
    document.addEventListener('keydown', handleEsc);

    // Return cleanup function
    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
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
