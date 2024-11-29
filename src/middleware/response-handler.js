const responseMiddleware = (req, res, next) => {
  res.sendSuccess = (data, message = 'Success', status = 200) => {
    return res.status(status).json({
      message,
      data,
      success: true,
    });
  };

  res.sendError = (message, errors = null, status = 400) => {
    return res.status(status).json({
      message,
      error: errors,
      success: false,
    });
  };

  next();
};

module.exports = responseMiddleware;
