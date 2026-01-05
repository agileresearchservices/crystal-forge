'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Date picker component with time selection
 * Returns ISO 8601 formatted datetime string
 */
export function DatePicker({ value, onChange, placeholder = 'Pick a date and time', disabled = false }: DatePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined);
  const [time, setTime] = useState<string>(date ? format(date, 'HH:mm') : '00:00');

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setDate(undefined);
      onChange('');
      return;
    }

    // Apply time to selected date
    const [hours, minutes] = time.split(':');
    selectedDate.setHours(parseInt(hours), parseInt(minutes));
    setDate(selectedDate);
    onChange(selectedDate.toISOString());
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setTime(newTime);

    if (date) {
      const [hours, minutes] = newTime.split(':');
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      setDate(newDate);
      onChange(newDate.toISOString());
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP p') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} initialFocus />

          {/* Time picker */}
          <div className="mt-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">Time</label>
            <input
              type="time"
              value={time}
              onChange={handleTimeChange}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
