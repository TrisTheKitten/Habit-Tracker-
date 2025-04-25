import React from 'react';
import { Habit } from '../types';
import { format, startOfWeek, addDays, getDay, isAfter, parseISO, isSameDay } from 'date-fns';
import { CheckCircle2, Circle, Trash2, Flame, Target, Repeat, CalendarDays } from 'lucide-react';
import DynamicTablerIcon from './DynamicTablerIcon'; // Import the icon component

const WEEK_DAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FULL_WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const cardColorThemes: { [key: string]: { 
    containerBg: string; 
    containerBorder: string; 
    hoverBorder: string;
    titleText: string;
    iconColor: string; 
    heatmapCompleteBg: string;
    heatmapCompleteBorder: string;
    streakIconColor: string;
    completionRing: string;
} } = {
  default: { containerBg: 'bg-gray-900', containerBorder: 'border-gray-800', hoverBorder: 'hover:border-gray-700', titleText: 'text-gray-100', iconColor: 'text-gray-500', heatmapCompleteBg: 'bg-teal-600/70', heatmapCompleteBorder: 'border-teal-500/80', streakIconColor: 'text-yellow-500', completionRing: 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-400' },
  blue: { containerBg: 'bg-blue-900/30', containerBorder: 'border-blue-700/40', hoverBorder: 'hover:border-blue-600/60', titleText: 'text-blue-200', iconColor: 'text-blue-400/70', heatmapCompleteBg: 'bg-sky-500/70', heatmapCompleteBorder: 'border-sky-400/80', streakIconColor: 'text-cyan-400', completionRing: 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300' },
  green: { containerBg: 'bg-emerald-900/30', containerBorder: 'border-emerald-700/40', hoverBorder: 'hover:border-emerald-600/60', titleText: 'text-emerald-200', iconColor: 'text-emerald-400/70', heatmapCompleteBg: 'bg-green-500/70', heatmapCompleteBorder: 'border-green-400/80', streakIconColor: 'text-lime-400', completionRing: 'bg-green-500/20 hover:bg-green-500/30 text-green-300' },
  purple: { containerBg: 'bg-purple-900/30', containerBorder: 'border-purple-700/40', hoverBorder: 'hover:border-purple-600/60', titleText: 'text-purple-200', iconColor: 'text-purple-400/70', heatmapCompleteBg: 'bg-violet-500/70', heatmapCompleteBorder: 'border-violet-400/80', streakIconColor: 'text-fuchsia-400', completionRing: 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300' },
  red: { containerBg: 'bg-red-900/30', containerBorder: 'border-red-700/40', hoverBorder: 'hover:border-red-600/60', titleText: 'text-red-200', iconColor: 'text-red-400/70', heatmapCompleteBg: 'bg-rose-500/70', heatmapCompleteBorder: 'border-rose-400/80', streakIconColor: 'text-pink-400', completionRing: 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300' },
  orange: { containerBg: 'bg-orange-900/30', containerBorder: 'border-orange-700/40', hoverBorder: 'hover:border-orange-600/60', titleText: 'text-orange-200', iconColor: 'text-orange-400/70', heatmapCompleteBg: 'bg-amber-500/70', heatmapCompleteBorder: 'border-amber-400/80', streakIconColor: 'text-yellow-400', completionRing: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300' },
  yellow: { containerBg: 'bg-yellow-900/30', containerBorder: 'border-yellow-700/40', hoverBorder: 'hover:border-yellow-600/60', titleText: 'text-yellow-200', iconColor: 'text-yellow-400/70', heatmapCompleteBg: 'bg-yellow-500/70', heatmapCompleteBorder: 'border-yellow-400/80', streakIconColor: 'text-amber-400', completionRing: 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300' },
  pink: { containerBg: 'bg-pink-900/30', containerBorder: 'border-pink-700/40', hoverBorder: 'hover:border-pink-600/60', titleText: 'text-pink-200', iconColor: 'text-pink-400/70', heatmapCompleteBg: 'bg-pink-500/70', heatmapCompleteBorder: 'border-pink-400/80', streakIconColor: 'text-rose-400', completionRing: 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-300' },
  cyan: { containerBg: 'bg-cyan-900/30', containerBorder: 'border-cyan-700/40', hoverBorder: 'hover:border-cyan-600/60', titleText: 'text-cyan-200', iconColor: 'text-cyan-400/70', heatmapCompleteBg: 'bg-cyan-500/70', heatmapCompleteBorder: 'border-cyan-400/80', streakIconColor: 'text-sky-400', completionRing: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300' },
};

const getFrequencyText = (habit: Habit): string => {
    switch (habit.frequency) {
        case 'daily': return 'Daily';
        case 'weekly': return `Weekly`; 
        case 'specific_days': 
            if (!habit.specificDays || habit.specificDays.length === 0) return 'Specific days (None)';
            if (habit.specificDays.length === 7) return 'Daily';
            return habit.specificDays.map(d => FULL_WEEK_DAYS[d]).join(', ');
        default: return 'Unknown Frequency';
    }
};

interface HabitCardProps {
  habit: Habit;
  today: Date;
  onToggleComplete: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, today, onToggleComplete, onDelete }) => {
  const todayFormatted = format(today, 'yyyy-MM-dd');
  const isCompletedToday = habit.completionHistory?.includes(todayFormatted) ?? false;

  const theme = cardColorThemes[habit.color || 'default'] || cardColorThemes.default;

  const weekStart = startOfWeek(today, { weekStartsOn: 0 }); 
  const last7Days = Array.from({ length: 7 }).map((_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));

  const handleToggle = () => {
    onToggleComplete(habit.id, todayFormatted);
  };

  return (
    <div key={habit.id} className={`${theme.containerBg} ${theme.containerBorder} ${theme.hoverBorder} rounded-xl p-5 shadow-lg transition-all duration-300 flex flex-col justify-between hover:shadow-teal-950/20`}>
        <div className='flex justify-between items-start mb-4 gap-3'>
            <div className='flex-1 overflow-hidden'>
                <div className='flex items-center gap-2'>
                    {habit.icon && <DynamicTablerIcon name={habit.icon as keyof typeof import('lucide-react')} size={24} className={`opacity-80 ${theme.iconColor}`} />} {/* Display Icon */}
                    <h3 className={`text-base font-semibold mb-1 truncate ${theme.titleText}`}>{habit.name}</h3>
                </div>
                {habit.description && <p className="text-xs text-gray-500 mb-2 break-words font-light italic truncate">{habit.description}</p>}
                <div className={`flex flex-wrap gap-x-3 gap-y-1 text-xs mt-1 ${theme.iconColor}`}> 
                    <span className='flex items-center gap-1' title={`Frequency: ${getFrequencyText(habit)}`}><Repeat size={11}/> {getFrequencyText(habit)}</span>
                    {habit.goal && habit.goal > 1 && (
                        <span className='flex items-center gap-1' title={`Goal: ${habit.goal} times per ${habit.frequency === 'daily' ? 'day' : habit.frequency === 'weekly' ? 'week' : 'month'}`}><Target size={11}/>
                            {habit.goal} times
                        </span>
                    )}
                    {habit.goalEndDate && (
                        <span className='flex items-center gap-1' title={`Goal End Date: ${format(parseISO(habit.goalEndDate), 'MMM dd, yyyy')}`}><CalendarDays size={11}/>
                            Ends {format(parseISO(habit.goalEndDate), 'MMM dd')}
                        </span>
                    )}
                </div>
            </div>
            <button 
                onClick={handleToggle} 
                className={`flex-shrink-0 p-1.5 rounded-full transition-all duration-200 active:scale-90 ${isCompletedToday ? theme.completionRing : 'bg-gray-800 hover:bg-gray-700 text-gray-600'}`}
                aria-label={isCompletedToday ? `Mark ${habit.name} as incomplete for today` : `Mark ${habit.name} as complete for today`}
            >
                {isCompletedToday ? <CheckCircle2 size={20} /> : <Circle size={20} />}
            </button>
        </div>
        
        <div className='mb-4'>
            <div className='flex justify-between items-center gap-0.5 sm:gap-1'>
                {last7Days.map((dateStr) => {
                    const isComplete = habit.completionHistory?.includes(dateStr);
                    const currentDayDate = parseISO(dateStr);
                    const isFuture = isAfter(currentDayDate, today) && !isSameDay(currentDayDate, today); 
                    const dayInitial = WEEK_DAY_INITIALS[getDay(currentDayDate)]; 
                    const isToday = isSameDay(currentDayDate, today);

                    return (
                        <div key={dateStr} className='flex flex-col items-center gap-1 w-7 sm:w-8'> 
                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-sm border transition-colors 
                                ${isFuture ? 'bg-gray-800/50 border-gray-700/50' : 
                                 isComplete ? `${theme.heatmapCompleteBg} ${theme.heatmapCompleteBorder}` : 
                                 'bg-gray-700 border-gray-600'}`                 
                            }> 
                            </div>
                            <span className={`text-[10px] sm:text-xs font-mono ${isToday ? theme.streakIconColor : 'text-gray-600'}`}>{dayInitial}</span> 
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-800/70"> 
            <div className={`flex items-center gap-3 text-xs ${theme.iconColor}`}> 
                <div className='flex items-center gap-1' title={`Current Streak: ${habit.streak ?? 0} days`}>
                    <Flame size={12} className={`${(habit.streak ?? 0) > 0 ? theme.streakIconColor : 'text-gray-600'}`}/>
                    <span className='font-medium'>{habit.streak ?? 0}</span>
                    <span className='text-gray-600'>Current</span> 
                </div>
                <div className='flex items-center gap-1 text-gray-600' title={`Longest Streak: ${habit.longestStreak} days`}>
                    <Target size={12} />
                    <span className='font-medium'>{habit.longestStreak}</span>
                    <span className='text-gray-600'>Longest</span> 
                </div>
            </div>
            <button onClick={() => onDelete(habit.id)} className='text-gray-700 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-900/30' title='Delete Habit'> 
                <Trash2 size={14}/>
            </button>
        </div>
    </div>
  );
};

export default HabitCard;
