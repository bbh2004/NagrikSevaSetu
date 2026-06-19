// src/middleware/validate.js
// ─────────────────────────────────────────────────────────────
// Request Validation Middleware (using Joi)
//
// Why validate incoming data?
//   Imagine someone sends POST /api/complaints with:
//   { "description": "x", "category": "Hacking", "lat": 999 }
//
//   Without validation, this garbage data would hit Mongoose,
//   which would throw a confusing database error. The client
//   would get a 500 Internal Server Error with no useful info.
//
//   With Joi, we define EXACTLY what shape the request body
//   must have BEFORE any database code runs. Bad data gets
//   a clear 400 Bad Request with specific field errors.
//
// How it works:
//   1. We define a Joi schema (a set of rules).
//   2. We create a middleware using 'validate(schema)'.
//   3. We add that middleware to a route.
//   4. If validation passes, next() is called.
//   5. If it fails, we return 400 with the exact error details.
// ─────────────────────────────────────────────────────────────

const Joi = require('joi');

/**
 * validate(schema)
 * Middleware factory for request body validation.
 * @param {Joi.Schema} schema - Joi schema to validate req.body against
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return ALL errors, not just the first one
      stripUnknown: true, // Remove any fields not in the schema (security)
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''), // Clean up Joi's quotes
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed. Check the errors array for details.',
        errors,
      });
    }

    // Replace req.body with the validated (and sanitized) value
    req.body = value;
    next();
  };
};

// ─────────────────────────────────────────────────────────────
// SCHEMAS - Define the validation rules for each endpoint
// ─────────────────────────────────────────────────────────────

// POST /api/complaints
// Phase 2.3: description is optional IF voiceNoteUrl is provided.
// Citizens can submit a complaint using EITHER text, voice, or both.
// At least one of (description, voiceNoteUrl) must be present.
const createComplaintSchema = Joi.object({
  category: Joi.string()
    .valid('Sanitation', 'Water', 'Electrical', 'Road', 'Others')
    .required()
    .messages({
      'any.only': 'Category must be one of: Sanitation, Water, Electrical, Road, Others',
      'any.required': 'Category is required',
    }),

  // description is optional when a voice note is provided, but must be
  // at least 10 chars if present. We enforce "at least one" via .or() below.
  description: Joi.string().min(10).max(1000).optional().allow(null, '').messages({
    'string.min': 'Description must be at least 10 characters',
    'string.max': 'Description cannot exceed 1000 characters',
  }),

  lat: Joi.number().min(-90).max(90).required().messages({
    'number.min': 'Latitude must be between -90 and 90',
    'number.max': 'Latitude must be between -90 and 90',
    'any.required': 'Latitude is required',
  }),
  lng: Joi.number().min(-180).max(180).required().messages({
    'number.min': 'Longitude must be between -180 and 180',
    'number.max': 'Longitude must be between -180 and 180',
    'any.required': 'Longitude is required',
  }),
  imageUrl: Joi.string().uri().optional().allow(null, ''),
  voiceNoteUrl: Joi.string().uri().optional().allow(null, ''),
})
// STRICT XOR: Require exactly one of description or voiceNoteUrl, but NOT both.
.xor('description', 'voiceNoteUrl')
.messages({
  'object.missing': 'Please provide either a written description or a voice note recording',
  'object.xor': 'You cannot provide both a text description and a voice note. Please choose one.',
});

// PATCH /api/complaints/:id/status
const updateStatusSchema = Joi.object({
  status: Joi.string().valid('Pending', 'In Progress', 'Resolved', 'Rejected').required(),
  note: Joi.string().optional().allow(null, ''),
});

// POST /api/users/sync
const syncUserSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  phone: Joi.string().optional().allow(null, ''),
});

module.exports = {
  validate,
  schemas: {
    createComplaint: createComplaintSchema,
    updateStatus: updateStatusSchema,
    syncUser: syncUserSchema,
  },
};
