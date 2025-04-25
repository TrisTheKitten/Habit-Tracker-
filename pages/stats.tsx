import { useState, useEffect, useMemo } from 'react';
import { 
  getHabitData, 
  calculateCompletionRate, 
  calculateOverallConsistency, 
  calculateCurrentStreak, 
  calculateLongestStreak 
} from '../lib/statsUtils';
import { Habit } from '../types';
import Link from 'next/link'; 
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  parseISO 
} from 'date-fns';
import BadgeDisplay from '../components/BadgeDisplay';
import * as Icons from 'lucide-react';
import { Home } from 'lucide-react';

// PDF Generation
import jsPDF from 'jspdf';

const StatsPage = () => {
  // --- 1. Define ALL hooks unconditionally ---
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data only on the client side
    if (typeof window !== 'undefined') {
      const data = getHabitData();
      setHabits(data);
      setLoading(false);
    }
  }, []); // Runs only once on mount

  // Add effect to reload data when the window gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (typeof window !== 'undefined') {
        console.log('[StatsPage] Window focused. Attempting to reload data...');
        const data = getHabitData();
        console.log('[StatsPage] Data loaded on focus:', JSON.stringify(data)); // Log the actual data
        setHabits(data);
      }
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Runs only once to set up the listener

  // Calculate all derived stats using useMemo, only when data is ready
  const statsData = useMemo(() => {
    const today = new Date(); // Define today consistently

    // Return default structure if loading or no habits
    if (loading || habits.length === 0) {
      return {
        today,
        averageWeeklyRate: 0,
        averageMonthlyRate: 0,
        averageOverallConsistency: 0,
        weeklyCompletionData: [],
      };
    }

    // Calculate average rates across all habits
    const totalHabits = habits.length;
    const sumWeeklyRate = habits.reduce((sum, habit) => sum + calculateCompletionRate(habit, 7), 0);
    const sumMonthlyRate = habits.reduce((sum, habit) => sum + calculateCompletionRate(habit, 30), 0);
    const sumOverallConsistency = habits.reduce((sum, habit) => sum + calculateOverallConsistency(habit), 0);

    const averageWeeklyRate = totalHabits > 0 ? Math.round(sumWeeklyRate / totalHabits) : 0;
    const averageMonthlyRate = totalHabits > 0 ? Math.round(sumMonthlyRate / totalHabits) : 0;
    const averageOverallConsistency = totalHabits > 0 ? Math.round(sumOverallConsistency / totalHabits) : 0;

    // We can add logic for weeklyCompletionData later if needed

    return {
      today,
      averageWeeklyRate,
      averageMonthlyRate,
      averageOverallConsistency,
      weeklyCompletionData: [], // Placeholder
    };
  }, [loading, habits]);

  // --- 2. Conditional rendering logic AFTER hooks ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-300 p-4 md:p-8 font-sans flex flex-col">
        <div className="max-w-6xl mx-auto w-full text-center py-20">
          <p className="text-xl text-gray-400">Loading stats...</p>
        </div>
      </div>
    );
  }

  // Check habits.length directly for the empty state
  if (habits.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-300 p-4 md:p-8 font-sans flex flex-col">
        <div className="max-w-6xl mx-auto w-full">
          {/* Header for Empty State */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">Stats & Reporting</h1>
            <Link href="/" className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-150">
              <Home className="w-5 h-5 mr-1" />
              Back to Habits
            </Link>
          </div>
          {/* Empty State Message */}
          <div className="text-center py-20 bg-slate-800 rounded-lg shadow-md">
            <p className="text-xl text-gray-300">No habit data found. Start tracking some habits first!</p>
          </div>
        </div>
      </div>
    );
  }

  // --- PDF Export Handler --- 
  const handleGeneratePdf = () => {
    // Check habits length again before generating PDF with potentially real data
    if (habits.length === 0) {
      alert('No habit data available to generate a report.');
      return;
    }

    try {
      const doc = new jsPDF();
      // Destructure needed values from statsData (which now holds real data)
      const { today, averageWeeklyRate, averageOverallConsistency } = statsData;
      
      let y = 15; // Initial Y position

      // --- Report Title --- 
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Habit Tracker - Weekly Report', 14, y);
      y += 8; // Increase spacing

      // --- Week Date Range --- 
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Week: ${format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')} to ${format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')}`, 14, y);
      y += 12; // Increase spacing

      // --- Weekly Summary --- 
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Weekly Summary', 14, y);
      y += 7; // Increase spacing

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`- Overall Completion Rate: ${averageWeeklyRate}%`, 14, y);
      y += 6; // Increase spacing
      doc.text(`- Weekly Consistency Score: ${averageOverallConsistency}%`, 14, y);
      y += 15; // Increase spacing

      // --- Habit Details --- 
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Habit Details', 14, y);
      y += 7;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      habits.forEach((habit, index) => {
        if (index > 0) { // Add spacing between habits
          y += 10;
        }
        
        // Habit Name (Bold)
        doc.setFont('helvetica', 'bold');
        doc.text(habit.name, 14, y);
        y += 6;
        doc.setFont('helvetica', 'normal');

        // Calculate stats for the specific habit
        const overallRate = calculateCompletionRate(habit, 365); // Example: overall = last year
        const currentStreak = calculateCurrentStreak(habit);
        const longestStreak = calculateLongestStreak(habit);

        doc.text(`Overall Rate: ${overallRate}%`, 14, y);
        y += 6;
        doc.text(`Current Streak: ${currentStreak} days`, 14, y);
        y += 6;
        doc.text(`Longest Streak: ${longestStreak} days`, 14, y);
        y += 6;

        // Display weekly status (Mon-Sun)
        let weeklyStatusString = 'Status (Mon-Sun): '; 
        const weekDays = eachDayOfInterval({ start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) });
        weekDays.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCompleted = habit.completions?.[dateStr];
          // Use Checkmark for completed, X for not completed
          weeklyStatusString += isCompleted ? '✓ ' : '✗ ';
        });
        doc.text(weeklyStatusString.trim(), 14, y);
        y += 6;

        // Add goal end date if it exists
        if (habit.goalEndDate) {
          doc.text(`Goal Ends: ${format(parseISO(habit.goalEndDate), 'MMM dd, yyyy')}`, 14, y);
          y += 6;
        }
      });

      // Save the PDF
      doc.save(`habit-tracker-weekly-report-${format(today, 'yyyy-MM-dd')}.pdf`);

    } catch (error) { // Catch block remains the same
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF report.");
    }
  };

  // --- 4. Main return (uses statsData) ---
  // If we reach here, loading is false, and habits.length > 0
  // statsData contains the calculated values
  return (
    <div className="min-h-screen bg-gray-950 text-gray-300 p-4 md:p-8 font-sans flex flex-col">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header with Back Link */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Stats & Reporting</h1>
          <Link href="/" className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-150">
            <Home className="w-5 h-5 mr-1" />
            Back to Habits
          </Link>
        </div>

        {/* Main Content using statsData */} 
        <div className="space-y-8">
          {/* Core Metrics Section */}
          <section className="bg-slate-800 p-6 rounded-lg shadow-md">
            {/* ... UI using statsData.averageWeeklyRate etc ... */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Weekly Rate */}
              <div className="text-center p-4 border border-gray-700 rounded">
                <p className="text-sm text-gray-400">This Week&apos;s Completion</p>
                <p className="text-3xl font-bold text-indigo-400">{statsData.averageWeeklyRate}%</p>
              </div>
              {/* Monthly Rate */}
              <div className="text-center p-4 border border-gray-700 rounded">
                <p className="text-sm text-gray-400">This Month&apos;s Completion</p>
                <p className="text-3xl font-bold text-indigo-400">{statsData.averageMonthlyRate}%</p>
              </div>
              {/* Consistency Score */}
              <div className="text-center p-4 border border-gray-700 rounded">
                <p className="text-sm text-gray-400">Weekly Consistency</p>
                <p className="text-3xl font-bold text-indigo-400">{statsData.averageOverallConsistency}%</p>
              </div>
            </div>

            {/* Habit Specific Overall Rates */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-3 text-gray-300">Overall Completion Rate per Habit:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-400">
                {habits.map((habit: Habit) => ( // Use habits directly here
                  <li key={habit.id}> 
                    {habit.icon} {habit.name}: {calculateOverallConsistency(habit)}%
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Milestones & Badges Section */}
          <section className="bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Milestones & Badges</h2>
            <div className="space-y-5">
              {habits.map((habit: Habit) => ( // Use habits directly
                <BadgeDisplay key={habit.id} habit={habit} />
              ))}
              {/* Removed redundant empty check here */}
            </div>
          </section>

          {/* Exports & Reports Section */}
          <section className="bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Exports & Reports</h2>
            <div>
              <p className="text-gray-400 mb-3">Generate a summary report of your progress for the current week.</p>
              <button
                onClick={handleGeneratePdf}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center transition-colors duration-150"
              >
                <Icons.Download className="w-4 h-4 mr-2" /> 
                Download Weekly PDF Report
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default StatsPage;
