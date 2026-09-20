export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 400);
    this.name = 'NotFoundError';
  }
}

export class ProviderError extends AppError {
  constructor(message, details = null) {
    super(message, 502, details);
    this.name = 'ProviderError';
  }
}
