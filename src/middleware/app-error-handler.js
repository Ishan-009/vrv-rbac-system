const AppError = require('../utils/error/app-error');
const appErrorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode || 500).json({
      message: err.message,
      error: err.explanation,
      success: false,
    });
  }
  next(err);
};

module.exports = appErrorHandler;
