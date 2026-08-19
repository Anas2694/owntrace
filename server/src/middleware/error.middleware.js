import AppError from '../utils/app-error.js'

function notFoundHandler(_request, _response, next) {
  next(new AppError('API route not found.', 404, 'NOT_FOUND'))
}

function errorHandler(error, _request, response, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    response.status(400).json({
      success: false,
      code: 'INVALID_JSON',
      message: 'Request body contains invalid JSON.',
    })
    return
  }

  const statusCode = error.statusCode || 500
  const isOperationalError = error instanceof AppError
  const payload = {
    success: false,
    code: error.code || 'INTERNAL_ERROR',
    message:
      statusCode >= 500 && !isOperationalError
        ? 'An unexpected server error occurred.'
        : error.message,
  }

  if (error.details && statusCode < 500) payload.errors = error.details

  if (statusCode >= 500) {
    console.error('Unhandled API error', { name: error.name })
  }

  response.status(statusCode).json(payload)
}

export { errorHandler, notFoundHandler }
