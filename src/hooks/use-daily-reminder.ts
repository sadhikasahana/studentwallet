import { useEffect, useState, useCallback } from "react";

const getTodayKey = () => new Date().toISOString().split("T")[0];

export const useDailyReminder = () => {
  const [shouldShowReminder, setShouldShowReminder] = useState(true);

  // Check on mount if expense was added today
  useEffect(() => {
    const stored = localStorage.getItem("lastExpenseAddedDate");
    const today = getTodayKey();
    
    if (stored === today) {
      setShouldShowReminder(false);
    } else {
      setShouldShowReminder(true);
    }
  }, []);

  // Call this when user adds/starts entering expense
  const markExpenseAdded = useCallback(() => {
    localStorage.setItem("lastExpenseAddedDate", getTodayKey());
    setShouldShowReminder(false);
  }, []);

  return { shouldShowReminder, markExpenseAdded };
};
