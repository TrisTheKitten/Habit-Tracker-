import { Habit } from '../types';
import { format, differenceInDays, parseISO, isBefore, startOfDay } from 'date-fns';

export function getHabitData(): Habit[] {
  if (typeof window === 'undefined') {
    return []; 
  }
  const storedData = localStorage.getItem('habits');
  if (!storedData) {
    return [];
  }
  try {
    const parsedData = JSON.parse(storedData);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (parsedData as any[]).map(raw => { 

      const completions: Record<string, boolean> = {};
      if (Array.isArray(raw.completionHistory)) {
          raw.completionHistory.forEach((date: string) => {

             try {
                 const parsedDate = startOfDay(parseISO(date));
                 completions[format(parsedDate, 'yyyy-MM-dd')] = true;
             } catch { 
                 console.error(`Invalid date format in completionHistory for habit ${raw.id}: ${date}`);
             }
          });
      }

      const targetDays: number[] = Array.isArray(raw.specificDays) ? raw.specificDays : [];

      return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        icon: raw.icon, 
        color: raw.color, 
        frequency: raw.frequency,
        specificDays: targetDays,
        createdAt: raw.createdAt, 
        completionHistory: raw.completionHistory, 
        completions: completions, 
        goalValue: raw.goalValue,
        goalUnit: raw.goalUnit,
        endDate: raw.endDate,
        streak: raw.streak || 0, 
        longestStreak: raw.longestStreak || 0 
      };
    });
  } catch (error) {
    console.error('Error parsing habits from localStorage:', error);
    return [];
  }
}


const isComplete = (date: Date, habit: Habit): boolean => {
  const dateString = format(date, 'yyyy-MM-dd');
  return habit.completions?.[dateString] === true;
};

export const calculateCurrentStreak = (habit: Habit): number => {
  const today = startOfDay(new Date());
  let currentStreak = 0;
  const checkDate = new Date(today); 

  while (isComplete(checkDate, habit)) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1); 
  }

  return currentStreak;
};

export const calculateLongestStreak = (habit: Habit): number => {
    if (!habit.completionHistory || habit.completionHistory.length === 0) {
        return 0;
    }

    const sortedDates = habit.completionHistory
        .map(dateStr => startOfDay(parseISO(dateStr)))
        .sort((a, b) => a.getTime() - b.getTime());

    let longestStreak = 0;
    let currentStreak = 0;

    if (sortedDates.length > 0) {
        longestStreak = 1; 
        currentStreak = 1;
    }

    for (let i = 1; i < sortedDates.length; i++) {
        const diff = differenceInDays(sortedDates[i], sortedDates[i - 1]);
        
        if (diff === 1) {
            currentStreak++;
        } else if (diff > 1) {

            currentStreak = 1;
        } 

        
        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }
    }

    return longestStreak;
};

export const BADGE_MILESTONES = [
  { days: 7, name: '1 Week', icon: 'Award' }, 
  { days: 14, name: '2 Weeks', icon: 'Medal' }, 
  { days: 30, name: '1 Month', icon: 'Star' },
  { days: 60, name: '2 Months', icon: 'Trophy' },
  { days: 90, name: '3 Months', icon: 'Gem' },
  { days: 180, name: '6 Months', icon: 'Crown' },
  { days: 365, name: '1 Year', icon: 'Rocket' }, 
];


export const calculateCompletionRate = (habit: Habit, days: number): number => {
  const endDate = startOfDay(new Date());
  const startDate = startOfDay(new Date());
  startDate.setDate(endDate.getDate() - (days - 1));

  let completedCount = 0;
  let totalDays = 0;

  const currentDate = new Date(startDate); 
  while (currentDate <= endDate) {
    totalDays++;
    if (isComplete(currentDate, habit)) {
      completedCount++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalDays === 0 ? 0 : Math.round((completedCount / totalDays) * 100);
};


export const calculateOverallConsistency = (habit: Habit): number => {
    if (!habit.createdAt) return 0;
    
    const creationDate = startOfDay(parseISO(habit.createdAt));
    const today = startOfDay(new Date());
    

    if (isBefore(today, creationDate)) return 0;

    const totalDaysSinceCreation = differenceInDays(today, creationDate) + 1;
    const totalCompletions = Object.keys(habit.completions || {}).length;
    
    if (totalDaysSinceCreation <= 0) return 0;
    
    return Math.round((totalCompletions / totalDaysSinceCreation) * 100);
};
