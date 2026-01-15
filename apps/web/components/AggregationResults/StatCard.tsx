'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Props for StatCard component
 */
interface StatCardProps {
  /** Card title/label */
  title: string;
  /** Primary value to display */
  value: number | string;
  /** Optional secondary value */
  secondaryValue?: number | string;
  /** Optional unit suffix (e.g., "ms", "$", "%") */
  unit?: string;
  /** Optional color variant */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Optional icon or visual element */
  icon?: React.ReactNode;
  /** Optional trend indicator: 'up', 'down', or 'neutral' */
  trend?: 'up' | 'down' | 'neutral';
  /** Optional change percentage for trend visualization */
  changePercent?: number;
  /** Optional className for container */
  className?: string;
}

/**
 * StatCard - Display single-value metrics in a visual card
 * Used for aggregation results like avg, sum, min, max, cardinality, etc.
 */
export function StatCard({
  title,
  value,
  secondaryValue,
  unit,
  variant = 'default',
  icon,
  trend,
  changePercent,
  className,
}: StatCardProps) {
  const variantClasses: Record<string, string> = {
    default: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const textVariantClasses: Record<string, string> = {
    default: 'text-blue-900 dark:text-blue-300',
    success: 'text-green-900 dark:text-green-300',
    warning: 'text-yellow-900 dark:text-yellow-300',
    danger: 'text-red-900 dark:text-red-300',
  };

  const labelVariantClasses: Record<string, string> = {
    default: 'text-blue-700 dark:text-blue-400',
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    danger: 'text-red-700 dark:text-red-400',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        variantClasses[variant],
        className
      )}
    >
      {/* Header with icon and title */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className={cn('text-xs font-medium', labelVariantClasses[variant])}>
            {title}
          </p>
        </div>
        {icon && (
          <div className="text-lg ml-2 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>

      {/* Main value */}
      <div className={cn('text-2xl font-bold', textVariantClasses[variant])}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>

      {/* Secondary value or trend indicator */}
      <div className="mt-2 flex items-center justify-between">
        {secondaryValue !== undefined && (
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium">
              {typeof secondaryValue === 'number' ? secondaryValue.toLocaleString() : secondaryValue}
            </span>
          </div>
        )}

        {trend && changePercent !== undefined && (
          <div
            className={cn(
              'text-xs font-medium flex items-center gap-1',
              trend === 'up' && 'text-green-600 dark:text-green-400',
              trend === 'down' && 'text-red-600 dark:text-red-400',
              trend === 'neutral' && 'text-gray-600 dark:text-gray-400'
            )}
          >
            {trend === 'up' && <span>↑</span>}
            {trend === 'down' && <span>↓</span>}
            {trend === 'neutral' && <span>→</span>}
            <span>{Math.abs(changePercent).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatCard;
