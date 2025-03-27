/**
 * Creates a standardized API response format
 * 
 * @param {Object} options - Response options
 * @param {any} options.data - Response data
 * @param {boolean} options.error - Error flag
 * @param {number} options.code - HTTP status code
 * @param {string} options.message - Response message
 * @returns {Object} Formatted response object
 */
export const formatResponse = ({ 
    data = {}, 
    error = false, 
    code = 200, 
    message = "success" 
  }) => {
    return {
      data,
      error,
      code,
      message
    };
  };