'use client';

import { format, subDays, startOfMonth, startOfYear } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateRangeValue {
  gte?: string;
  lte?: string;
}

interface DateRangePickerProps {
  value?: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  disabled?: boolean;
}

/**
 * Date range picker component for range queries
 * Allows selecting a date range with quick preset shortcuts
 */
export function DateRangePicker({ value, onChange, disabled = false }: DateRangePickerProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (value?.gte && value?.lte) {
      return {
        from: new Date(value.gte),
        to: new Date(value.lte),
      };
    }
    return undefined;
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    onChange({
      gte: range?.from?.toISOString(),
      lte: range?.to?.toISOString(),
    });
  };

  const handleQuickRange = (from: Date, to: Date) => {
    setDateRange({ from, to });
    onChange({
      gte: from.toISOString(),
      lte: to.toISOString(),
    });
  };

  const displayText =
    dateRange?.from && dateRange?.to
      ? `${format(dateRange.from, 'LLL dd, y')} - ${format(dateRange.to, 'LLL dd, y')}`
      : dateRange?.from
        ? format(dateRange.from, 'LLL dd, y')
        : 'Pick a date range';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled} className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayText}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <Calendar
            mode="range"
            selected={dateRange}
            onSelect={handleSelect}
            numberOfMonths={2}
            initialFocus
            disabled={disabled}
          />

          {/* Quick range shortcuts */}
          <div className="mt-4 space-y-2 border-t pt-4">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Quick ranges:</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickRange(subDays(new Date(), 7), new Date())}
                className="text-xs"
              >
                Last 7 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickRange(subDays(new Date(), 30), new Date())}
                className="text-xs"
              >
                Last 30 days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickRange(startOfMonth(new Date()), new Date())}
                className="text-xs"
              >
                This month
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickRange(startOfYear(new Date()), new Date())}
                className="text-xs"
              >
                This year
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
