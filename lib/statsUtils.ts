import { Habit } from '../types';
import { format, differenceInDays, differenceInCalendarDays, parseISO, isBefore, startOfDay } from 'date-fns';

// Function to parse habit data from localStorage
export function getHabitData(): Habit[] {
  if (typeof window === 'undefined') {
    return []; // Return empty array on server-side
  }
  const storedData = localStorage.getItem('habits');
  if (!storedData) {
    return [];
  }
  try {
    const parsedData = JSON.parse(storedData);
    // Transform raw data to Habit type, ensuring completions map and targetDays array
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (parsedData as any[]).map(raw => { // Acknowledge 'any' for localStorage parsing

      // Convert completionHistory array to completions map
      const completions: Record<string, boolean> = {};
      if (Array.isArray(raw.completionHistory)) {
          raw.completionHistory.forEach((date: string) => {
             // Ensure date is in YYYY-MM-DD format and normalized to start of day
             try {
                 const parsedDate = startOfDay(parseISO(date));
                 completions[format(parsedDate, 'yyyy-MM-dd')] = true;
             } catch { // Removed unused variable binding
                 console.error(`Invalid date format in completionHistory for habit ${raw.id}: ${date}`);
             }
          });
      }
      
      // Ensure targetDays exists (important for specific_days frequency)
      const targetDays: number[] = Array.isArray(raw.specificDays) ? raw.specificDays : [];

      // Return object conforming to Habit type
      return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        icon: raw.icon, // Ensure icon is carried over
        color: raw.color, // Ensure color is carried over
        frequency: raw.frequency,
        specificDays: targetDays,
        createdAt: raw.createdAt, 
        completionHistory: raw.completionHistory, // Keep original history for reference if needed
        completions: completions, // Add the derived completions map
        goalValue: raw.goalValue,
        goalUnit: raw.goalUnit,
        endDate: raw.endDate,
        // Recalculate streaks based on the new completions map just in case
        // Note: We might rely on stored streaks, but recalculating ensures consistency
        streak: raw.streak || 0, // Use stored streak or default to 0
        longestStreak: raw.longestStreak || 0 // Use stored longest or default to 0
      };
    });
  } catch (error) {
    console.error('Error parsing habits from localStorage:', error);
    return [];
  }
}

// --- Streak Calculation Logic ---

// Helper to check if a date is a completion date
const isComplete = (date: Date, habit: Habit): boolean => {
  const dateString = format(date, 'yyyy-MM-dd');
  return habit.completions?.[dateString] === true;
};

// Calculate current streak
export const calculateCurrentStreak = (habit: Habit): number => {
  const today = startOfDay(new Date());
  let currentStreak = 0;
  const checkDate = new Date(today); // Use const and create copy

  while (isComplete(checkDate, habit)) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1); // Move to the previous day
  }

  return currentStreak;
};

// Calculate the longest streak
export const calculateLongestStreak = (habit: Habit): number => {
    if (!habit.completions || Object.keys(habit.completions).length === 0) {
        return 0;
    }

    // Get sorted dates from the completions map keys
    const completionDates = Object.keys(habit.completions)
        .map(dateStr => parseISO(dateStr))
        .sort((a, b) => differenceInDays(a, b));

    let longestStreak = 0;
    let currentStreak = 0;

    for (let i = 0; i < completionDates.length; i++) {
        const currentDate = completionDates[i]; // Already parsed and sorted

        if (i === 0) {
            // First completion always starts a streak of 1
            currentStreak = 1;
        } else {
            // Check if the current date is consecutive to the previous one
            const previousDate = completionDates[i - 1];
            // Use differenceInCalendarDays for robustness across DST changes etc.
            if (differenceInCalendarDays(currentDate, previousDate) === 1) {
                // Dates are consecutive, increment streak
                currentStreak++;
            } else if (differenceInCalendarDays(currentDate, previousDate) > 1) {
                // Reset streak if there's a gap greater than 1 day
                currentStreak = 1;
            } 
            // If diff is 0 (same day completion), streak continues but doesn't increment for that specific duplicate.
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }
    }

    return longestStreak;
};


// --- Badge Milestones --- 
export const BADGE_MILESTONES = [
  { days: 7, name: '1 Week', icon: 'Award' }, 
  { days: 14, name: '2 Weeks', icon: 'Medal' }, 
  { days: 30, name: '1 Month', icon: 'Star' },
  { days: 60, name: '2 Months', icon: 'Trophy' },
  { days: 90, name: '3 Months', icon: 'Gem' },
  { days: 180, name: '6 Months', icon: 'Crown' },
  { days: 365, name: '1 Year', icon: 'Rocket' }, 
];


// --- Other Stats Calculations ---

// Calculate completion rate for the last N days
export const calculateCompletionRate = (habit: Habit, days: number): number => {
  const endDate = startOfDay(new Date());
  const startDate = startOfDay(new Date());
  startDate.setDate(endDate.getDate() - (days - 1));

  let completedCount = 0;
  let totalDays = 0;

  const currentDate = new Date(startDate); // Use const
  while (currentDate <= endDate) {
    totalDays++;
    if (isComplete(currentDate, habit)) {
      completedCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalDays === 0 ? 0 : Math.round((completedCount / totalDays) * 100);
};

// Calculate overall consistency since habit creation
export const calculateOverallConsistency = (habit: Habit): number => {
    if (!habit.createdAt) return 0;
    
    const creationDate = startOfDay(parseISO(habit.createdAt));
    const today = startOfDay(new Date());
    
    // Ensure creationDate is not in the future
    if (isBefore(today, creationDate)) return 0;

    const totalDaysSinceCreation = differenceInDays(today, creationDate) + 1;
    const totalCompletions = Object.keys(habit.completions || {}).length;
    
    if (totalDaysSinceCreation <= 0) return 0;
    
    return Math.round((totalCompletions / totalDaysSinceCreation) * 100);
};
