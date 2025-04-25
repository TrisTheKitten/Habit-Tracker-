import React from 'react';
import { calculateCurrentStreak, calculateLongestStreak, BADGE_MILESTONES } from '../lib/statsUtils';
import { Habit } from '../types'; // Import Habit from types.ts
import DynamicTablerIcon, { IconName } from './DynamicTablerIcon'; // Import IconName type

interface BadgeDisplayProps {
  habit: Habit;
}

// Type guard to check if a string is a valid IconName
function isValidIconName(name: string): name is IconName {
  // This is a basic check; DynamicTablerIcon does a more robust check internally
  // For TypeScript's sake, we assume if it's a string, it *could* be an IconName
  return typeof name === 'string' && name.length > 0;
}

const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ habit }) => {
  const currentStreak = calculateCurrentStreak(habit);
  const longestStreak = calculateLongestStreak(habit);

  // Find the highest achieved milestone based on the longest streak
  const achievedMilestones = BADGE_MILESTONES.filter((m: { days: number }) => longestStreak >= m.days);
  const highestAchievedBadge = achievedMilestones.length > 0
    ? achievedMilestones[achievedMilestones.length - 1]
    : null;

  // Find the next milestone
  const nextMilestone = BADGE_MILESTONES.find((m: { days: number }) => longestStreak < m.days);

  const progressPercentage = nextMilestone
    ? Math.min(100, Math.floor((currentStreak / nextMilestone.days) * 100))
    : 100; // If all badges earned, show 100%

  return (
    <div className="bg-slate-800 p-4 rounded-lg shadow border border-gray-700/50">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          {/* Cast habit.icon to IconName */}
          {habit.icon && isValidIconName(habit.icon) && (
            <DynamicTablerIcon name={habit.icon} className="w-5 h-5 text-gray-400" />
          )}
          <h3 className="text-lg font-semibold text-gray-100">{habit.name} - Streaks &amp; Badges</h3>
        </div>
        {highestAchievedBadge && (
          <div className="flex items-center text-xs bg-yellow-700/50 text-yellow-200 px-2 py-0.5 rounded-full">
            {/* Cast highestAchievedBadge.icon to IconName */}
            {isValidIconName(highestAchievedBadge.icon) && (
              <DynamicTablerIcon name={highestAchievedBadge.icon} className="w-3 h-3 mr-1" />
            )}
            {highestAchievedBadge.name}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center text-sm mb-3">
        <p className="text-gray-300">Current Streak: <span className="font-bold text-green-400">{currentStreak} days</span></p>
        <p className="text-gray-300">Longest Streak: <span className="font-bold text-sky-400">{longestStreak} days</span></p>
      </div>

      {nextMilestone && (
        <div className="mt-2">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>Progress to next badge: {nextMilestone.name} ({nextMilestone.days} days)</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                  {currentStreak} / {nextMilestone.days} days
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-teal-400">
                  {progressPercentage}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-700">
              <div style={{ width: `${progressPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500 transition-all duration-500"></div>
            </div>
          </div>
          {currentStreak === 0 && <p className="text-xs text-gray-500 italic">Start today to make progress!</p>}
        </div>
      )}
      {!nextMilestone && currentStreak > 0 && (
         <p className="text-center text-sm text-green-400 mt-3 font-medium">Congratulations! You&apos;ve earned all streak badges for this habit!</p>
      )}
       {currentStreak === 0 && (
         <p className="text-center text-sm text-gray-500 mt-3">Complete the habit today to start a new streak!</p>
      )}

    </div>
  );
};

export default BadgeDisplay;
