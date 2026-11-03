// Basic input sanitization utility for SuiteGenie
// Follows OWASP best practices: removes XSS, SQL, NoSQL injection patterns

export function sanitizeInput(input, options = {}) {
  if (typeof input !== 'string') return input;
  let sanitized = input.trim();
  const maxLength = options.maxLength || 1000;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  // Remove common XSS patterns
  sanitized = sanitized.replace(/<script.*?>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');
  sanitized = sanitized.replace(/<.*?on\w+.*?>/gi, '');
  sanitized = sanitized.replace(/<.*?style=.*?>/gi, '');
  sanitized = sanitized.replace(/<.*?href=.*?>/gi, '');
  sanitized = sanitized.replace(/<.*?src=.*?>/gi, '');
  sanitized = sanitized.replace(/<.*?>/gi, '');
  // Remove SQL keywords
  sanitized = sanitized.replace(/\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|UNION)\b/gi, '[FILTERED]');
  // Remove NoSQL injection patterns
  sanitized = sanitized.replace(/\$\w+/g, '[FILTERED]');
  return sanitized;
}
