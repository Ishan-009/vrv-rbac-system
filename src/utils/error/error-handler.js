const AppError = require('./app-error');
const { StatusCodes } = require('http-status-codes');

const handleError = (error) => {
  if (error instanceof AppError) {
    throw error;
  }
  throw new AppError(
    'Internal Server Error',
    StatusCodes.INTERNAL_SERVER_ERROR
  );
};

module.exports = handleError;
