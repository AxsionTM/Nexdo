'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  priority?: string;
}

export function Checkbox({ checked, onCheckedChange, className, priority }: CheckboxProps) {
  const colorMap: Record<string, string> = {
    HIGH: 'border-red-500 data-[checked]:bg-red-500',
    MEDIUM: 'border-amber-500 data-[checked]:bg-amber-500',
    LOW: 'border-blue-500 data-[checked]:bg-blue-500',
    NONE: 'border-gray-400 data-[checked]:bg-gray-400',
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-checked={checked || undefined}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'h-4 w-4 shrink-0 rounded-full border-2 transition-colors flex items-center justify-center',
        colorMap[priority || 'NONE'],
        checked && 'text-white',
        className
      )}
    >
      {checked && <Check className="h-3 w-3" strokeWidth={3} />}
    </button>
  );
}
