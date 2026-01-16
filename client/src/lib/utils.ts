import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function formatDisplayDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (formatDate(date) === formatDate(today)) {
    return "Today";
  } else if (formatDate(date) === formatDate(yesterday)) {
    return "Yesterday";
  } else if (formatDate(date) === formatDate(tomorrow)) {
    return "Tomorrow";
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  });
}

export function getTimeCategoryIcon(category: string): string {
  switch (category) {
    case 'AM': return 'sunrise';
    case 'NOON': return 'sun';
    case 'PM': return 'moon';
    case 'ALL': return 'clock';
    default: return 'clock';
  }
}

export function getTimeCategoryLabel(category: string): string {
  switch (category) {
    case 'AM': return 'Morning';
    case 'NOON': return 'Noon';
    case 'PM': return 'Evening';
    case 'ALL': return 'All Day';
    default: return category;
  }
}
