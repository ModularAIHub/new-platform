import { sanitizeInput } from '../utils/sanitization.js';

// Middleware to sanitize all string fields in req.body
export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    }
  }
  next();
}

// Middleware to sanitize all string fields in req.query
export function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeInput(req.query[key]);
      }
    }
  }
  next();
}

// Middleware to sanitize all string fields in req.params
export function sanitizeParams(req, res, next) {
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeInput(req.params[key]);
      }
    }
  }
  next();
}
