export function errorHandlerMiddleware(logger) {
  return function errorHandler(err, req, res, next) {
    if (res.headersSent) {
      return next(err)
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      res.statusCode = 400
      res.json({ error: err.message })
    } else {
      switch (err.name) {
        case 'ValidationError':
        case 'DomainError':
          res.statusCode = 400
          res.json({ error: err.message })
          break
        default:
          logger.error(err.stack, { requestId: req.requestId })
          res.statusCode = 500
          res.json({ error: `${req.requestId}` })
      }
    }

    return next()
  }
}

export function logRequestMiddleware(logger) {
  return function logRequest(req, res, next) {
    const message = `${res.statusCode} ${req.method} ${req.originalUrl}`
    const data = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      headers: req.headers,
      body: req.body,
    }
    if (res.statusCode === 500) {
      logger.error(message, data)
    } else {
      logger.info(message, data)
    }
    next()
  }
}
