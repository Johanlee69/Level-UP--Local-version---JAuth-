const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const runCHAT = require('../config/geminiAPIConfig');

// @desc    Get response from Gemini AI
// @route   POST /api/chat/message
// @access  Public
exports.getChatResponse = asyncHandler(async (req, res, next) => {
  const { message } = req.body;

  if (!message) {
    return next(new ErrorResponse('Please provide a message', 400));
  }

  try {
    // Get response from Gemini AI
    const aiResponse = await runCHAT(message);
    
    res.status(200).json({
      success: true,
      data: {
        message: aiResponse
      }
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return next(new ErrorResponse('Could not generate AI response: ' + (error.message || ''), 500));
  }
}); 