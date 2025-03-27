/**
 * Utility for consistent API responses
 */

/**
 * Generate a standardized API response
 * @param {boolean} success - Request success status
 * @param {any} data - Response payload
 * @param {string} message - Response message
 * @param {number} statusCode - HTTP status code
 * @returns {Object} Standardized response object
 */
export const createResponse = (success = true, data = null, message = '', statusCode = 200) => {
    return {
      success,
      data,
      message,
      statusCode
    };
  };
  
  /**
   * Send a standardized API response
   * @param {Object} res - Express response object
   * @param {boolean} success - Request success status
   * @param {any} data - Response payload
   * @param {string} message - Response message
   * @param {number} statusCode - HTTP status code
   */
  export const sendResponse = (res, success = true, data = null, message = '', statusCode = 200) => {
    return res.status(statusCode).json(createResponse(success, data, message, statusCode));
  };