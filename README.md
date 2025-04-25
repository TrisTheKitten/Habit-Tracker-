# Momentum - Habit Tracker

This is a habit tracking web application built with [Next.js](https://nextjs.org) (using the Pages Router), [TypeScript](https://www.typescriptlang.org/), and styled with [Tailwind CSS](https://tailwindcss.com/).

## Features

*   **Add Habits:** Create new habits with details like name, description, goal, and frequency (daily, weekly, specific days).
*   **Optional Goal End Date:** Set an end date for your habit goals.
*   **Track Completion:** Mark habits as completed for the current day.
*   **Daily View:** See habits due today and track completion status.
*   **Streak Tracking:** Monitors current and longest streaks for each habit.
*   **7-Day History:** Visualizes the completion status for the past week.
*   **Categories:** Organize habits by category, add new categories, and filter the habit list.
*   **Advanced Options:** Configure additional habit settings, such as goal end date and category, in the 'Create New Habit' modal form.
*   **Persistence:** Habit data is saved in the browser's `localStorage`.
*   **Modern UI:** Clean, dark-themed interface using [lucide-react](https://lucide.dev/) icons.

## Try Now : https://momentum-habit-tracker.vercel.app

## Getting Started

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd habit-tracker
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```

4.  **Open the application:**
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

*   `pages/index.tsx`: The main page component, responsible for state management, orchestrating the habit tracker UI, handling habit/category logic, and data persistence.
*   `pages/_app.tsx`: Custom App component to load global styles.
*   `components/AddHabitModal.tsx`: React component for the 'Create New Habit' modal form, including basic inputs and a collapsible 'Advanced Options' section (Goal End Date, Category, Icon).
*   `components/HabitCard.tsx`: React component for displaying an individual habit card, including completion heatmap, streaks, and goal end date (if set).
*   `types.ts`: TypeScript definitions for shared types like `Habit`, `Category`, and `Frequency`.
*   `styles/globals.css`: Global CSS file, primarily for Tailwind CSS directives.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.mjs`: Next.js configuration.

## Technologies Used

*   **Framework:** [Next.js](https://nextjs.org/) (Pages Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Icons:** [lucide-react](https://lucide.dev/)
*   **State Management:** React Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`)
*   **Date Handling:** [date-fns](https://date-fns.org/)
*   **Persistence:** Browser `localStorage`

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.
