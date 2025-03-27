import { getDb } from '../config/database.js';

/**
 * Count users registered on a specific day
 * 
 * @param {string} year - Two-digit year
 * @param {string} month - Two-digit month
 * @param {string} day - Two-digit day
 * @returns {Promise<number>} - Count of users registered on that day
 */
export async function countUsersForDay(year, month, day) {
  try {
    const datePrefix = `ZEN${year}${month}${day}`; // Match format
    console.log("Counting users for date:", datePrefix);

    const db = getDb();
    const count = await db.collection('users').countDocuments({
      userId: { $regex: `^${datePrefix}` }, // Match userId starting with this date
    });

    console.log(`Users registered on ${datePrefix}:`, count);
    return count; // Return count for that day
  } catch (error) {
    console.error("Error counting users:", error);
    return 0; // Default to 0 if an error occurs
  }
}

/**
 * Generate a structured user ID in the format ZEN{YY}{MM}{DD}{HH}{MM}{#####}
 * where the last part is incremented based on user count for the day
 * 
 * @returns {Promise<string>} - Generated user ID
 */
export async function generateUserId() {
  const now = new Date();
  const year = String(now.getFullYear()).slice(2); // YY
  const month = String(now.getMonth() + 1).padStart(2, "0"); // MM
  const day = String(now.getDate()).padStart(2, "0"); // DD
  const hour = String(now.getHours()).padStart(2, "0"); // HH
  const minute = String(now.getMinutes()).padStart(2, "0"); // MM

  // Fetch user count for this day
  const userCount = await countUsersForDay(year, month, day);
  const countFormatted = String(userCount + 1).padStart(5, "0"); // Increment count

  console.log("Generated User ID:", `ZEN${year}${month}${day}${hour}${minute}${countFormatted}`);
  return `ZEN${year}${month}${day}${hour}${minute}${countFormatted}`;
}