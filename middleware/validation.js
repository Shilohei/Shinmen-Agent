const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Chat message validation
const validateChatMessage = [
  body('message')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Message must be between 1 and 10000 characters'),
  body('conversationId')
    .optional()
    .isUUID()
    .withMessage('Conversation ID must be a valid UUID'),
  handleValidationErrors
];

// API configuration validation
const validateApiConfig = [
  body('providerName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Provider name is required and must be less than 100 characters'),
  body('endpointUrl')
    .isURL()
    .withMessage('Please provide a valid endpoint URL'),
  body('authType')
    .isIn(['apiKey', 'bearer', 'oauth'])
    .withMessage('Auth type must be one of: apiKey, bearer, oauth'),
  body('credentials')
    .isObject()
    .withMessage('Credentials must be an object'),
  body('rateLimit.requestsPerMinute')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Requests per minute must be between 1 and 1000'),
  body('rateLimit.requestsPerDay')
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage('Requests per day must be between 1 and 100000'),
  handleValidationErrors
];

// Conversation validation
const validateConversation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  handleValidationErrors
];

// UUID parameter validation
const validateUUIDParam = (paramName) => [
  param(paramName)
    .isUUID()
    .withMessage(`${paramName} must be a valid UUID`),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// File upload validation
const validateFileUpload = [
  body('fileType')
    .optional()
    .isIn(['image', 'document', 'code'])
    .withMessage('File type must be one of: image, document, code'),
  handleValidationErrors
];

// Password update validation
const validatePasswordUpdate = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateChatMessage,
  validateApiConfig,
  validateConversation,
  validateUUIDParam,
  validatePagination,
  validateFileUpload,
  validatePasswordUpdate,
  handleValidationErrors
};
