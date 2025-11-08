/**
 * Date utility functions for chat messages
 */

/**
 * Formats a date string to DD/MM/YYYY format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatMessageDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Checks if a date is today
 * @param dateString - ISO date string
 * @returns True if the date is today
 */
export const isToday = (dateString: string): boolean => {
  const messageDate = new Date(dateString);
  const today = new Date();

  return (
    messageDate.getDate() === today.getDate() &&
    messageDate.getMonth() === today.getMonth() &&
    messageDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Checks if a date is yesterday
 * @param dateString - ISO date string
 * @returns True if the date is yesterday
 */
export const isYesterday = (dateString: string): boolean => {
  const messageDate = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    messageDate.getDate() === yesterday.getDate() &&
    messageDate.getMonth() === yesterday.getMonth() &&
    messageDate.getFullYear() === yesterday.getFullYear()
  );
};

/**
 * Gets a display label for a message date
 * Shows "Aujourd'hui", "Hier", or the formatted date
 * @param dateString - ISO date string
 * @returns Display label for the date
 */
export const getMessageDateLabel = (dateString: string): string => {
  if (isToday(dateString)) {
    return "Aujourd'hui";
  }
  if (isYesterday(dateString)) {
    return "Hier";
  }
  return formatMessageDate(dateString);
};

/**
 * Checks if two date strings are on different days
 * @param date1 - First ISO date string
 * @param date2 - Second ISO date string
 * @returns True if the dates are on different days
 */
export const isDifferentDay = (date1: string, date2: string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getDate() !== d2.getDate() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getFullYear() !== d2.getFullYear()
  );
};
