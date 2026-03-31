/**
 * Zod Validation Schemas for API Endpoints
 * 
 * Centralized input validation for all API routes
 * Provides type safety, consistent error messages, and security
 */

const { z } = require('zod');

// ══════════════════════════════════════════════════════════════
// CARD ENDPOINTS
// ══════════════════════════════════════════════════════════════

const CreateCardSchema = z.object({
  bankname: z.string()
    .min(1, 'Bank name is required')
    .max(100, 'Bank name must be less than 100 characters')
    .trim(),
  cardname: z.string()
    .min(1, 'Card name is required')
    .max(100, 'Card name must be less than 100 characters')
    .trim(),
  last4digits: z.string()
    .regex(/^\d{4}$/, 'Last 4 digits must be exactly 4 numbers'),
  cardtype: z.enum(['credit', 'debit', 'prepaid', 'other'])
    .default('credit'),
  colortheme: z.string()
    .max(50, 'Color theme must be less than 50 characters')
    .optional(),
});

const UpdateCardSchema = z.object({
  bankName: z.string()
    .min(1, 'Bank name must have at least 1 character')
    .max(100, 'Bank name must be less than 100 characters')
    .optional(),
  cardName: z.string()
    .min(1, 'Card name must have at least 1 character')
    .max(100, 'Card name must be less than 100 characters')
    .optional(),
  last4Digits: z.string()
    .regex(/^\d{4}$/, 'Last 4 digits must be exactly 4 numbers')
    .optional(),
  cardType: z.enum(['credit', 'debit', 'prepaid', 'other'])
    .optional(),
  colorTheme: z.string()
    .max(50, 'Color theme must be less than 50 characters')
    .optional(),
  billingCycleDate: z.number()
    .int('Billing cycle date must be an integer')
    .min(1, 'Billing cycle date must be between 1-31')
    .max(31, 'Billing cycle date must be between 1-31')
    .optional(),
}).strict();

// ══════════════════════════════════════════════════════════════
// BILL ENDPOINTS
// ══════════════════════════════════════════════════════════════

const UpdateBillStatusSchema = z.object({
  status: z.enum(['Paid', 'Pending', 'Overdue', 'paid', 'pending', 'overdue'], {
    errorMap: () => ({ message: 'Status must be one of: Paid, Pending, or Overdue' })
  })
    .transform(s => {
      // Normalize to title case
      return s.toLowerCase() === 'paid' ? 'Paid' 
           : s.toLowerCase() === 'pending' ? 'Pending'
           : 'Overdue';
    }),
  amount_paid: z.number()
    .min(0, 'Amount paid cannot be negative')
    .optional(),
  paid_date: z.string()
    .datetime('Paid date must be a valid ISO 8601 datetime')
    .optional(),
});

// ══════════════════════════════════════════════════════════════
// CHATBOT ENDPOINTS
// ══════════════════════════════════════════════════════════════

const ChatbotMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),
  userEmail: z.string()
    .email('Invalid email address'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    message: z.string()
  }))
    .optional(),
});

const ChatbotHistoryParamSchema = z.object({
  userEmail: z.string()
    .email('Invalid email address'),
});

// ══════════════════════════════════════════════════════════════
// NOTIFICATION ENDPOINTS
// ══════════════════════════════════════════════════════════════

const MarkNotificationReadSchema = z.object({
  notificationId: z.string()
    .min(1, 'Notification ID is required')
    .uuid('Invalid notification ID format')
    .optional(),
  id: z.string()
    .uuid('Invalid notification ID format')
    .optional(),
}).refine(
  (obj) => obj.notificationId || obj.id,
  { message: 'Either notificationId or id is required' }
);

// ══════════════════════════════════════════════════════════════
// VALIDATION MIDDLEWARE FACTORY
// ══════════════════════════════════════════════════════════════

/**
 * Create validation middleware for request body
 * @param {z.ZodSchema} schema - Zod validation schema
 * @param {string} type - 'body', 'params', or 'query'
 * @returns {Function} Express middleware
 */
const validateRequest = (schema, type = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = type === 'body' 
        ? req.body 
        : type === 'params' 
          ? req.params 
          : req.query;

      const validated = schema.parse(dataToValidate);

      // Store validated data based on type
      if (type === 'body') {
        req.validated = validated;
      } else if (type === 'params') {
        req.validatedParams = validated;
      } else if (type === 'query') {
        req.validatedQuery = validated;
      }

      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors = err.errors.map(e => ({
          field: e.path.join('.') || e.code,
          message: e.message,
          code: e.code
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: errors,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        error: 'Internal validation error',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ══════════════════════════════════════════════════════════════
// VALIDATION RESULT TYPE CHECK (Helper)
// ══════════════════════════════════════════════════════════════

/**
 * Validate and return result (non-middleware usage)
 * @param {z.ZodSchema} schema - Zod validation schema
 * @param {Object} data - Data to validate
 * @returns {Object} { success, data, errors }
 */
const validateData = (schema, data) => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result, errors: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: err.errors.map(e => ({
          field: e.path.join('.') || e.code,
          message: e.message
        }))
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ message: 'Unknown validation error' }]
    };
  }
};

// ══════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════

module.exports = {
  // Schemas
  CreateCardSchema,
  UpdateCardSchema,
  UpdateBillStatusSchema,
  ChatbotMessageSchema,
  ChatbotHistoryParamSchema,
  MarkNotificationReadSchema,

  // Middleware
  validateRequest,

  // Helper
  validateData,
};
