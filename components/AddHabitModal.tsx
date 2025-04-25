import React, { useState, useEffect } from 'react';
import { X, PlusCircle, Check, ChevronDown, ChevronRight, icons } from 'lucide-react'; 
import { Habit, Category, Frequency } from '../types'; 
import { COLOR_OPTIONS, ICON_LIST } from '../src/app/constants'; 
import DynamicTablerIcon from './DynamicTablerIcon'; 

// Default category option
const NO_CATEGORY_ID = "__NONE__";
const CREATE_CATEGORY_ID = "__CREATE__";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddHabit: (newHabitData: {
    name: string;
    description?: string;
    goal?: number;
    goalEndDate?: string;
    icon?: string;
    frequency: Frequency;
    specificDays?: number[];
    color?: string;
    category?: string; 
    id?: string; 
  }) => void;
  onAddCategory: (newCategory: Omit<Category, 'id'>) => Promise<Category | null>; 
  habitToEdit?: Habit | null;
  categories: Category[]; 
}

const AddHabitModal: React.FC<AddHabitModalProps> = ({ 
    isOpen, 
    onClose, 
    onAddHabit, 
    onAddCategory, 
    habitToEdit, 
    categories 
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState<number>(0); 
  const [goalEndDate, setGoalEndDate] = useState<string>(''); 
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [specificDays, setSpecificDays] = useState<number[]>([]); 
  const [selectedColor, setSelectedColor] = useState<string>(COLOR_OPTIONS[0].id);
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(undefined);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(NO_CATEGORY_ID); 

  // State for creating a new category
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<string | undefined>(undefined);
  const [newCategoryColor, setNewCategoryColor] = useState<string>(COLOR_OPTIONS[1].id); 
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false); // State for advanced section

  // Populate form if editing
  useEffect(() => {
    if (habitToEdit) { 
      setIsEditMode(true);
      setName(habitToEdit.name);
      setDescription(habitToEdit.description || '');
      setGoal(habitToEdit.goal || 0);
      setGoalEndDate(habitToEdit.goalEndDate || ''); 
      setFrequency(habitToEdit.frequency);
      setSpecificDays(habitToEdit.specificDays || []);
      setSelectedColor(habitToEdit.color || COLOR_OPTIONS[0].id);
      setSelectedIcon(habitToEdit.icon || undefined);
      // Use NO_CATEGORY_ID if habit has no category or category is invalid
      const categoryExists = categories.some(c => c.id === habitToEdit.category);
      setSelectedCategoryId(habitToEdit.category && categoryExists ? habitToEdit.category : NO_CATEGORY_ID);
    } else {
      // Reset form for adding new habit
      setIsEditMode(false);
      setName('');
      setDescription('');
      setGoal(0);
      setGoalEndDate(''); 
      setFrequency('daily');
      setSpecificDays([]);
      setSelectedColor(COLOR_OPTIONS[0].id);
      setSelectedIcon(undefined);
      setSelectedCategoryId(NO_CATEGORY_ID); 
      setShowNewCategoryForm(false); 
      setNewCategoryName('');
      setNewCategoryIcon(undefined);
      setNewCategoryColor(COLOR_OPTIONS[1].id);
    }
    // Reset advanced section visibility on open/edit change
    setIsAdvancedOpen(false);
  }, [isOpen, habitToEdit, categories]);

  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFrequency = e.target.value as Frequency;
    setFrequency(newFrequency);
    if (newFrequency !== 'specific_days') {
      setSpecificDays([]);
    }
  };

  const toggleSpecificDay = (dayIndex: number) => {
    setSpecificDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleAddHabit = () => {
    if (!name.trim() || showNewCategoryForm) return; 

    const newHabitData = {
      name: name.trim(),
      description: description.trim() || undefined,
      goal: goal > 0 ? goal : undefined,
      goalEndDate: goalEndDate || undefined, 
      icon: selectedIcon, 
      frequency,
      specificDays: frequency === 'specific_days' ? specificDays : undefined,
      color: selectedColor !== COLOR_OPTIONS[0].id ? selectedColor : undefined,
      category: selectedCategoryId === NO_CATEGORY_ID ? undefined : selectedCategoryId, 
      // Pass id only if editing
      ...(isEditMode && habitToEdit ? { id: habitToEdit.id } : {}),
    };
    onAddHabit(newHabitData);
    onClose();
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === CREATE_CATEGORY_ID) {
      setShowNewCategoryForm(true);
      setSelectedCategoryId(CREATE_CATEGORY_ID); 
    } else {
      setShowNewCategoryForm(false);
      setSelectedCategoryId(value);
    }
  };

  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim() || isSavingCategory) return;
    setIsSavingCategory(true);
    try {
      const createdCategory = await onAddCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor !== COLOR_OPTIONS[0].id ? newCategoryColor : undefined,
      });

      if (createdCategory) {
        setSelectedCategoryId(createdCategory.id); 
        setShowNewCategoryForm(false);
        setNewCategoryName('');
        setNewCategoryIcon(undefined);
        setNewCategoryColor(COLOR_OPTIONS[1].id);
      } else {
        // Handle error case if needed (e.g., display a message)
        console.error("Failed to save the new category.");
      }
    } catch (error) {
      console.error("Error saving category:", error);
    } finally {
      setIsSavingCategory(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto'>
      <div className='bg-gray-900 border border-gray-700 rounded-xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative my-8 animate-fade-in'>
        <button onClick={onClose} className='absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-700' title="Close">
          <X size={20}/>
        </button>
        <h2 className='text-xl md:text-2xl font-semibold mb-6 text-white'>
          {isEditMode ? 'Edit Habit' : 'Create New Habit'}
        </h2>
        
        <div className='space-y-4'>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Habit Name (e.g., Meditate 10 min)" required className='input-field' />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional, e.g., why it matters)" rows={2} className='input-field resize-none' />
          
          {/* Goal Input */}
          <div className="mb-4">
            <label htmlFor="goal" className="block text-sm font-medium text-gray-400 mb-1">Goal (Optional, e.g., 5 times)</label>
            <input
              type="number"
              id="goal"
              value={goal}
              onChange={(e) => setGoal(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 text-white"
              placeholder="e.g., 5"
            />
          </div>

          {/* Frequency Selection */}
          <div>
            <label htmlFor="frequencySelect" className="block text-sm font-medium text-gray-400 mb-1">Frequency</label>
            <select 
              id="frequencySelect"
              value={frequency} 
              onChange={handleFrequencyChange} 
              className='input-field bg-gray-800 w-full'
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option> 
              <option value="specific_days">Specific days of week</option>
            </select>
          </div>

          {/* Specific Days Selection (Conditional) */}
          {frequency === 'specific_days' && (
            <div className='p-3 bg-gray-800 rounded-lg border border-gray-700'>
              <label className='block text-sm font-medium text-gray-400 mb-2'>Select days:</label>
              <div className='flex flex-wrap justify-center gap-1 sm:gap-1.5'> 
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <button key={index} onClick={() => toggleSpecificDay(index)} className={`px-2 sm:px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors w-10 sm:w-12 h-9 sm:h-10 flex items-center justify-center ${specificDays.includes(index) ? 'bg-teal-600 border-teal-500 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600'}`}>{}
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* --- Advanced Options Section --- */}
          <div className="mt-4 border-t border-gray-700 pt-4"> 
            <button 
              type="button" 
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)} 
              className="flex justify-between items-center w-full text-left text-gray-400 hover:text-white transition-colors py-2" 
            > 
              <span className="text-sm font-medium">Advanced Options</span> 
              {isAdvancedOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />} 
            </button> 

            {isAdvancedOpen && ( 
              <div className="mt-3 space-y-4 pl-2 border-l-2 border-gray-700 ml-1 animate-fade-in"> 
                {/* Goal End Date Input */}
                <div className=""> 
                  <label htmlFor="goalEndDate" className="block text-sm font-medium text-gray-400 mb-1">Goal End Date (Optional)</label> 
                  <input 
                    type="date" 
                    id="goalEndDate" 
                    value={goalEndDate} 
                    onChange={(e) => setGoalEndDate(e.target.value)} 
                    className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-1 focus:ring-teal-500 text-white appearance-none" 
                    min={new Date().toISOString().split('T')[0]} // Optional: Prevent past dates 
                  /> 
                </div> 

                {/* Category Selection */}
                <div> 
                  <label htmlFor='categorySelectAdv' className='block text-sm font-medium text-gray-400 mb-1'>Category (Optional)</label> 
                  <select 
                    id='categorySelectAdv' 
                    value={selectedCategoryId} 
                    onChange={handleCategoryChange} 
                    className='input-field bg-gray-800 w-full' 
                    disabled={showNewCategoryForm} 
                  > 
                    <option value={NO_CATEGORY_ID}>No Category</option> 
                    {categories.map(cat => ( 
                      <option key={cat.id} value={cat.id}>{cat.name}</option> 
                    ))} 
                    <option value={CREATE_CATEGORY_ID}>+ Create New Category</option> 
                  </select> 
                </div> 

                {/* --- New Category Form (Conditional inside Advanced) --- */}
                {showNewCategoryForm && ( 
                  <div className='mt-3 p-4 bg-gray-800 border border-gray-700 rounded-lg space-y-3 animate-fade-in'> 
                    <h4 className='text-sm font-medium text-teal-400'>Create New Category</h4> 
                    <input 
                      type='text' 
                      placeholder='New Category Name' 
                      value={newCategoryName} 
                      onChange={(e) => setNewCategoryName(e.target.value)} 
                      className='input-field' 
                    /> 
                    {/* New Category Icon Selector */}
                    <div> 
                      <label className='block text-xs text-gray-400 mb-1'>Icon (Optional)</label> 
                      <div className='grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-700/50 rounded'> 
                        <button 
                          type='button' 
                          onClick={() => setNewCategoryIcon(undefined)} 
                          className={`p-2 rounded transition-colors ${!newCategoryIcon ? 'bg-teal-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`} 
                        > 
                          <X size={16}/> 
                        </button> 
                        {ICON_LIST.map(iconName => ( 
                          <button 
                            key={iconName} 
                            type='button' 
                            onClick={() => setNewCategoryIcon(iconName)} 
                            className={`p-2 rounded transition-colors ${newCategoryIcon === iconName ? 'bg-teal-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-300'}`} 
                            title={iconName} 
                          > 
                            <DynamicTablerIcon name={iconName as keyof typeof icons} size={16} /> 
                          </button> 
                        ))} 
                      </div> 
                    </div> 
                    {/* New Category Color Selector */}
                    <div> 
                      <label className='block text-xs text-gray-400 mb-1'>Color (Optional)</label> 
                      <div className='flex flex-wrap gap-2'> 
                        {COLOR_OPTIONS.map(color => ( 
                          <button 
                            key={color.id} 
                            type='button' 
                            onClick={() => setNewCategoryColor(color.id)} 
                            className={`w-6 h-6 rounded-full border-2 ${newCategoryColor === color.id ? 'border-white ring-2 ring-offset-1 ring-offset-gray-800 ring-teal-500' : 'border-transparent hover:border-gray-400'}`} 
                            style={{ backgroundColor: color.value }} 
                            title={color.name} 
                          /> 
                        ))} 
                      </div> 
                    </div> 
                    <div className='flex justify-end gap-2'> 
                      <button 
                        onClick={() => { 
                          setShowNewCategoryForm(false); 
                          setSelectedCategoryId(NO_CATEGORY_ID); 
                        }} 
                        className='text-xs px-3 py-1 rounded bg-gray-600 hover:bg-gray-500 text-gray-300 transition-colors' 
                        disabled={isSavingCategory} 
                      > 
                        Cancel 
                      </button> 
                      <button 
                        onClick={handleSaveNewCategory} 
                        className='text-xs px-3 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center gap-1 disabled:opacity-50' 
                        disabled={!newCategoryName.trim() || isSavingCategory} 
                      > 
                        {isSavingCategory ? 'Saving...' : <><Check size={14}/> Save Category</>} 
                      </button> 
                    </div> 
                  </div> 
                )} 

                {/* Habit Icon Selection */}
                <div> 
                  <label className='block text-sm font-medium text-gray-400 mb-1'>Habit Icon (Optional)</label> 
                  <div className='grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-800/50 rounded'> 
                    <button 
                      type='button' 
                      onClick={() => setSelectedIcon(undefined)} 
                      className={`p-2 rounded transition-colors ${!selectedIcon ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-400'}`} 
                      title="No icon" 
                    > 
                      <X size={18}/> 
                    </button> 
                    {ICON_LIST.map(iconName => ( 
                      <button 
                        key={iconName} 
                        type='button' 
                        onClick={() => setSelectedIcon(iconName)} 
                        className={`p-2 rounded transition-colors ${selectedIcon === iconName ? 'bg-teal-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-400'}`} 
                        title={iconName} 
                      > 
                        <DynamicTablerIcon name={iconName as keyof typeof icons} size={18} /> 
                      </button> 
                    ))} 
                  </div> 
                </div> 
              </div> 
            )} 
          </div>

          {/* Visuals: Color & Icon Selection */}
          <div className='grid grid-cols-2 gap-4 pt-2'>
            {/* Color Selection */}
            <div> 
              <label className='block text-sm font-medium text-gray-400 mb-1'>Color Theme (Optional)</label> 
              <div className='flex flex-wrap gap-2'> 
                {COLOR_OPTIONS.map(color => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.id)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor === color.id ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-gray-900 border-transparent' : 'border-gray-700 hover:border-gray-500'}`}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className='mt-8 flex justify-end'> 
            <button 
              onClick={handleAddHabit} 
              disabled={!name.trim() || showNewCategoryForm || isSavingCategory} 
              className='px-3 py-1 rounded text-xs bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center gap-1 disabled:opacity-50' 
            > 
              {isEditMode ? <Check size={14}/> : <PlusCircle size={14}/>} 
              {isEditMode ? 'Save Changes' : 'Add Habit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddHabitModal;
