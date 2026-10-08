import { param, body, oneOf, query } from 'express-validator';
import { handleValidationErrors } from './handleValidationErrors.js';

export const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID must be a positive integer'),

  handleValidationErrors,
];

export const validateCreatePost = [
  body('title')
    .isString()
    .withMessage('Tile must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .bail()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters')
    .escape(),

  body('content')
    .isString()
    .withMessage('Content must be a string')
    .bail()
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .bail()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters')
    .escape(),

  handleValidationErrors,
];

export const validateUpdatePost = [
  oneOf([body('title').exists(), body('content').exists()], {
    message: 'At least one field (title, content) must be provided',
  }),

  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .bail()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters')
    .escape(),

  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .bail()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters')
    .escape(),

  handleValidationErrors,
];

export const validatePostQuery = [
  query('sortBy')
    .optional()
    .isIn(['id', 'title', 'content', 'createdAt'])
    .withMessage('sortBy must be one of id, title, content, createdAt'),

  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('order must be either asc or desc'),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('offset must be a non-negative integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be an integer between 1 and 50'),

  handleValidationErrors,
];
