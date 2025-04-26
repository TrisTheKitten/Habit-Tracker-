import { Category, Habit } from '../types';

const CATEGORIES_STORAGE_KEY = 'habit_tracker_categories';
const HABITS_STORAGE_KEY = 'habits';

export const loadCategories = (): Category[] => {
  if (typeof window === 'undefined') {
    return []; // Return empty array on server-side
  }
  try {
    const storedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    return storedCategories ? JSON.parse(storedCategories) : [];
  } catch (error) {
    console.error('Error retrieving categories from localStorage:', error);
    return [];
  }
};

export const saveCategories = (categories: Category[]): void => {
  if (typeof window === 'undefined') {
    return; // Do nothing on server-side
  }
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories to localStorage:', error);
  }
};

// --- Habit Storage --- 

export const loadHabits = (): Habit[] => {
  if (typeof window === 'undefined') {
    return []; 
  }
  try {
    const storedHabits = localStorage.getItem(HABITS_STORAGE_KEY);
    return storedHabits ? JSON.parse(storedHabits) : [];
  } catch (error) {
    console.error('Error retrieving habits from localStorage:', error);
    return [];
  }
};

export const saveHabits = (habits: Habit[]): void => {
  if (typeof window === 'undefined') {
    return; 
  }
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
    // Dispatch a custom event to notify other components of the change
    window.dispatchEvent(new CustomEvent('storageUpdated'));
    console.log('[storage.ts] Dispatched storageUpdated event.'); // For debugging
  } catch (error) {
    console.error('Error saving habits to localStorage:', error);
  }
};
