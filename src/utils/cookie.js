import { serialize } from "cookie";

/**
 * Clear authentication cookie
 * @returns {Object} Cookie header object
 */
export const clearAuthCookie = () => {
  return serialize("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: new Date(0),
    path: "/",
  });
};

/**
 * Set authentication cookie
 * @param {string} token - JWT token to store in cookie
 * @param {number} maxAge - Cookie max age in seconds
 * @returns {Object} Cookie header object
 */
export const setAuthCookie = (token, maxAge = 3600) => {
  return serialize("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge,
    path: "/",
  });
};