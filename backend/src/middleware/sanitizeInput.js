// Removes keys that start with "$" or contain "." from the request body
// to block NoSQL operator injection like { "email": { "$gt": "" } }
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !key.startsWith('$') && !key.includes('.'))
        .map(([key, val]) => [key, clean(val)]),
    );
  }
  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  next();
};

export default sanitizeInput;
