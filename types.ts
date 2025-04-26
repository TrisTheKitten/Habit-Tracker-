export type Frequency = 'daily' | 'weekly' | 'monthly' | 'specific_days';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: Frequency;
  // Change goal type to string to store custom text
  goal?: string; 
  goalEndDate?: string; // Optional end date for the habit goal (e.g., 'YYYY-MM-DD')
  completions: { [date: string]: boolean }; // Changed value type to boolean only
  specificDays?: number[];
  createdAt: string;
  color?: string;
  icon?: string;
  category?: string;
  completionHistory?: string[];
  streak?: number;
  longestStreak?: number;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}
