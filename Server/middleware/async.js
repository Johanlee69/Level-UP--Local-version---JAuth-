/**
 * Async middleware to handle express async/await error handling
 * This eliminates the need for try/catch blocks in route controllers
 * @param {Function} fn Function that needs error handling
 * @returns {Function} Express middleware function with error handling
 */
const asyncHandler = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 