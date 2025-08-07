const errorHandler = (err, req, res, next) => {
  console.log({
    event: 'error_handler',
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  if (res.headersSent) {
    return next(err);
  }

  const isDevelopment = process.env.NODE_ENV === 'development';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.code === '23505') {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference';
  }

  const errorResponse = {
    error: {
      message,
      status: statusCode
    }
  };

  if (isDevelopment) {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
  }

  if (req.accepts('html')) {
    return res.status(statusCode).render('error', {
      title: `Error ${statusCode}`,
      message,
      status: statusCode,
      stack: isDevelopment ? err.stack : null
    });
  } else {
    return res.status(statusCode).json(errorResponse);
  }
};

const notFound = (req, res) => {
  const message = `Route ${req.originalUrl} not found`;

  if (req.accepts('html')) {
    return res.status(404).render('error', {
      title: 'Page Not Found',
      message,
      status: 404
    });
  } else {
    return res.status(404).json({
      error: {
        message,
        status: 404
      }
    });
  }
};

module.exports = {
  errorHandler,
  notFound
};
