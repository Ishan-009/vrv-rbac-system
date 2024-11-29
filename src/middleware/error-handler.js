const errorHandler = (err, req, res, next) => {
  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    return res.status(400).json({
      message: 'Invalid JSON in request body',
      success: false,
    });
  }
  //  generic error handler
  return res.status(500).json({
    message: 'Internal server error',
    success: false,
  });
};

module.exports = errorHandler;
