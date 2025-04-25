import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Target, LineChart, X } from 'lucide-react'; // Removed unused Calendar, Trash2
import { Habit, Category } from '../types';
import HabitCard from '../components/HabitCard';
import AddHabitModal from '../components/AddHabitModal';
import DynamicTablerIcon, { IconName } from '../components/DynamicTablerIcon'; // Import IconName
import { v4 as uuidv4 } from 'uuid';
import { format, isSameDay } from 'date-fns'; // Removed unused parseISO, subDays, addDays, addWeeks, addMonths, getWeek
import Link from 'next/link';
import { loadHabits, saveHabits, loadCategories, saveCategories } from '../utils/storage';

const getTodayDateString = () => {
  const todayDate = new Date();
  return format(todayDate, 'yyyy-MM-dd');
};

const calculateCurrentStreak = (habit: Habit): number => {
  const today = getTodayDateString();
  let currentStreak = 0;
  const checkDate = new Date(today);
  const completions = habit.completions || {}; // Use completions map

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd'); // Use format directly
    if (completions[dateStr]) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // Allow skipping weekends if configured?
      // Add logic here if needed based on frequency/settings
      break;
    }
  }
  return currentStreak;
};

const calculateLongestStreak = (habit: Habit): number => {
  const completions = habit.completions || {};
  const dates = Object.keys(completions).filter(date => completions[date]).sort();
  if (dates.length === 0) return 0;

  let longestStreak = 0;
  let currentStreak = 0;
  const expectedDate = new Date(dates[0]);

  for (let i = 0; i < dates.length; i++) {
    const currentDate = new Date(dates[i]);
    if (isSameDay(currentDate, expectedDate)) { // Use imported isSameDay
      currentStreak++;
    } else {
      // Reset if dates are not consecutive
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1; // Start new streak
    }
    // Determine the next expected date based on frequency
    if (habit.frequency === 'daily') {
      expectedDate.setDate(expectedDate.getDate() + 1);
    } else if (habit.frequency === 'weekly') {
      expectedDate.setDate(expectedDate.getDate() + 7);
    } else if (habit.frequency === 'monthly') {
      expectedDate.setMonth(expectedDate.getMonth() + 1);
    } else if (habit.frequency === 'specific_days' && habit.specificDays) {
      // More complex logic for specific days needed here
      // Placeholder: just check next day for now
      expectedDate.setDate(expectedDate.getDate() + 1);
    } else {
      expectedDate.setDate(expectedDate.getDate() + 1); // Default to daily progression if unsure
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);
  return longestStreak;
};

const HabitTracker = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const today = new Date();

  useEffect(() => {
    const loadedHabits = loadHabits().map(habit => ({
      ...habit,
      streak: calculateCurrentStreak(habit),
      longestStreak: calculateLongestStreak(habit),
    }));
    const loadedCategories = loadCategories();

    setHabits(loadedHabits);
    setCategories(loadedCategories);
  }, []);

  useEffect(() => {
    saveHabits(habits);
  }, [habits]);

  useEffect(() => {
    saveCategories(categories);
  }, [categories]);

  // Function to handle adding a new category from the modal
  const handleAddNewCategory = async (newCategoryData: Omit<Category, 'id'>): Promise<Category | null> => {
    try {
      const newCategory: Category = {
        ...newCategoryData,
        id: uuidv4(), // Generate unique ID
      };
      setCategories(prev => [...prev, newCategory]);
      // Maybe add a small delay or confirmation before returning if needed
      return newCategory; // Return the created category
    } catch (error) {
      console.error("Failed to add category:", error);
      return null; // Indicate failure
    }
  };

  // Adjusted type for habitDataFromModal to match AddHabitModal's onAddHabit prop
  const handleSaveHabit = (habitDataFromModal: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'completions' | 'createdAt'> & { id?: string }) => {
    let updatedHabits;
    const habitToSave = { ...habitDataFromModal }; // Clone to avoid modifying original
    const existingIndex = habits.findIndex(h => h.id === habitToSave.id);

    if (existingIndex > -1 && habitToSave.id) {
      // Edit existing habit: Merge new data with existing data
      updatedHabits = habits.map(h => h.id === habitToSave.id ? { ...h, ...habitToSave } : h);
    } else {
      // Add new habit: Generate ID, set defaults
      const newHabit: Habit = {
        ...habitToSave,
        id: uuidv4(), // Generate new ID
        createdAt: new Date().toISOString(), // Set creation date
        completions: {}, // Initialize completions
        streak: 0, // Initialize streak
        longestStreak: 0, // Initialize longest streak
        // completionHistory is not used with the new completions map logic
      };
      updatedHabits = [...habits, newHabit];
    }

    // Recalculate streaks after updating
    const finalHabits = updatedHabits.map(h => ({
      ...h,
      streak: calculateCurrentStreak(h),
      longestStreak: calculateLongestStreak(h),
    }));

    setHabits(finalHabits);
    setShowAddModal(false); // Close modal after saving
    setEditingHabitId(null); // Reset editing state
  };

  const handleDeleteHabit = (id: string) => {
    const updatedHabits = habits.filter(habit => habit.id !== id);
    setHabits(updatedHabits);
  };

  const handleDeleteCategory = (categoryIdToDelete: string) => {
    if (window.confirm('Are you sure you want to delete this category? This will remove the category from all associated habits.')) {
      // Remove the category from the state
      setCategories(prevCategories => prevCategories.filter(category => category.id !== categoryIdToDelete));
  
      // Update habits: remove the category ID from habits that used it
      setHabits(prevHabits => prevHabits.map(habit => {
        if (habit.category === categoryIdToDelete) {
          return { ...habit, category: undefined }; // Or set to null/default category ID if preferred
        }
        return habit;
      }));
  
      // If the deleted category was the selected one, reset the filter
      if (selectedCategoryId === categoryIdToDelete) {
        setSelectedCategoryId(null);
      }
    }
  };

  const handleToggleCompletion = (id: string, date: string = format(today, 'yyyy-MM-dd')) => {
    setHabits(prevHabits =>
      prevHabits.map(habit => {
        if (habit.id === id) {
          // Clone the habit and ensure completions object exists
          const updatedHabit = {
            ...habit,
            completions: { ...(habit.completions || {}) } // Ensure completions is an object
          };

          // Toggle completion state for the given date in the object map
          if (updatedHabit.completions[date]) {
            delete updatedHabit.completions[date]; // Mark as incomplete
          } else {
            updatedHabit.completions[date] = true; // Mark as complete
          }

          // Recalculate streaks immediately after toggle using the updated completions map
          updatedHabit.streak = calculateCurrentStreak(updatedHabit);
          updatedHabit.longestStreak = calculateLongestStreak(updatedHabit);

          return updatedHabit;
        }
        return habit;
      })
    );
  };

  const handleSelectCategory = useCallback((categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  }, []);

  const filteredHabits = useMemo(() => {
    if (!selectedCategoryId) {
      return habits; // Show all if no category selected
    }
    return habits.filter(habit => habit.category === selectedCategoryId);
  }, [habits, selectedCategoryId]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-4 md:p-8 font-sans flex flex-col">
      {/* --- Header --- */}
      <header className="mb-10 flex flex-col items-center text-center"> 
        <div className="mb-6"> 
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-serif">Momentum</h1> 
          <p className="text-base text-gray-500 mt-2 font-serif">Minimalist&apos;s habit tracker</p>
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Link href="/stats" className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-150">
              <LineChart className="w-5 h-5 mr-1" />
              Stats & Reports
            </Link>
          </div>
        </div>
      </header>

      {/* --- Add Habit Modal --- */}
      <AddHabitModal 
          isOpen={showAddModal} 
          onClose={() => {
              setShowAddModal(false);
              setEditingHabitId(null); // Reset edit state on close
          }}
          onAddHabit={handleSaveHabit} 
          onAddCategory={handleAddNewCategory} // Pass the handler function
          categories={categories} // Pass categories state to modal
          habitToEdit={habits.find(h => h.id === editingHabitId) || null}
      />

<<<<<<< HEAD
      {/* --- Category Filter --- */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-400 mr-2">Filter by Category:</span>
          {/* All Button */}
          <button
            onClick={() => handleSelectCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5 ${ 
              !selectedCategoryId
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            All
          </button>
          {/* Category Buttons */}
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleSelectCategory(category.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-2 relative group ${ 
                selectedCategoryId === category.id
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
            >
              {category.icon && <DynamicTablerIcon name={category.icon as IconName} size={14} strokeWidth={1.5} />} {/* Fixed cast */}
              <span>{category.name}</span>
              {/* Delete Button */} 
              <button 
                onClick={(e) => { 
                   e.stopPropagation(); // Prevent category selection
                   handleDeleteCategory(category.id); 
                }}
                className="absolute -right-1 -top-1 p-0.5 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" // Style the delete button
                aria-label={`Delete category ${category.name}`}
                title={`Delete category ${category.name}`}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* --- Habit Grid --- */}
      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredHabits.length === 0 ? (
          // Empty state content
          <div className='md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-10 px-4 bg-gray-900/50 rounded-lg border border-gray-800'>
              <Target size={40} className='mx-auto text-gray-600 mb-4' strokeWidth={1.5}/>
              <h3 className='text-lg font-semibold text-gray-400 mb-2'>
                {selectedCategoryId ? 'No habits found in this category.' : (habits.length === 0 ? 'Your habit list is empty.' : 'No habits match the filter.')} 
              </h3>
              <p className='text-sm text-gray-500 mb-6 max-w-xs mx-auto'>
                {selectedCategoryId ? 'Try selecting "All" or adding habits to this category.' : (habits.length === 0 ? 'Start building positive routines today by adding your first habit!' : '')}
              </p>
          </div>
        ) : (
          // Render habits if filteredHabits is not empty
          filteredHabits.map(habit => { 
              return (
                <HabitCard 
                   key={habit.id}
                   habit={habit} 
                   today={today} // Pass the Date object
                   onToggleComplete={() => handleToggleCompletion(habit.id)}
                   onDelete={() => handleDeleteHabit(habit.id)}
                 />
             );
          })
=======
      <main className="flex-grow">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-2 border-b border-gray-800 pb-3">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-300 tracking-wide">Today <span className='text-gray-500 font-normal text-lg'>({completedTodayCount()}/{dueHabits().length} done)</span></h2>
            <div className='flex items-center gap-2 text-gray-400 text-sm font-medium'>
                <Calendar size={15}/>
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
            </div>
        </div>
        
        {habits.length === 0 ? (
            <div className='text-center py-16 px-6 bg-gray-900 rounded-xl border border-dashed border-gray-800 shadow-inner mt-8'>
                <Target size={40} className='mx-auto text-gray-700 mb-4'/>
                <h3 className='text-lg font-semibold text-gray-400 mb-2'>Your habit list is empty.</h3>
                <p className='text-gray-500 mb-6 max-w-xs mx-auto'>Start building positive routines today. Add your first habit!</p>
                <button onClick={() => setShowAddModal(true)} className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition duration-200 flex items-center gap-2 mx-auto">
                     <Plus size={18}/> Add First Habit
                </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {dueHabits().map(habit => {
                const completed = isCompletedToday(habit);
                return (
                    <HabitCard 
                        key={habit.id}
                        habit={habit}
                        isCompletedToday={completed}
                        today={today}
                        last7Days={last7Days()}
                        onToggleComplete={toggleComplete}
                        onDelete={deleteHabit}
                    />
                );
            })}
            {dueHabits().length === 0 && habits.length > 0 && (
                 <div className='md:col-span-2 lg:col-span-3 text-center py-12 px-6 bg-gray-900 rounded-xl border border-dashed border-gray-800 shadow-inner mt-8'>
                    <CheckCircle2 size={36} className='mx-auto text-teal-600 mb-4'/>
                    <h3 className='text-lg font-semibold text-gray-400 mb-2'>No habits due today!</h3>
                    <p className='text-gray-500'>Enjoy your well-deserved break or plan for tomorrow.</p>
                </div>
            )}
            </div>
        )}
        {habits.length > 0 && (
         <div className='flex justify-center mt-8'>
           <button
             onClick={() => setShowAddModal(true)}
             className='bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center space-x-2 transform hover:scale-105 active:scale-95'
           >
             <Plus size={18} />
             <span>Add Habit</span>
           </button>
         </div>
>>>>>>> 16fafb736cbb0ebef8c696176748164e818d7e41
        )}
      </main>

      {/* --- Add Habit Button --- */}
      <div className='flex justify-center mt-8'>
        <button
          onClick={() => setShowAddModal(true)}
          className='bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center space-x-2 transform hover:scale-105 active:scale-95'
        >
          <Plus size={18} />
          <span>Add Habit</span>
        </button>
      </div>

      {/* --- Footer --- */}
      <footer className="mt-auto pt-10 text-center text-xs text-gray-600">
        Momentum by Tris 2025
      </footer>

      {/* --- Global Styles --- */}
      <style jsx global>{`
        .input-field {
            width: 100%;
            padding: 0.75rem 1rem;
            background-color: #1f2937; 
            border-radius: 0.5rem; 
            border: 1px solid #374151; 
            color: #e5e7eb; 
            font-size: 0.9rem;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field::placeholder {
            color: #6b7280; 
        }
        .input-field:focus {
            outline: none;
            border-color: #2dd4bf; 
            box-shadow: 0 0 0 2px rgba(45, 212, 191, 0.3);
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fade-in {
            animation: fade-in 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HabitTracker;
