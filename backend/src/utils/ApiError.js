// Throw this anywhere in a controller; the error middleware turns it into JSON.
export default class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
