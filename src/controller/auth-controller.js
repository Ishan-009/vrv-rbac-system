const authService = require('../services/auth-service');
const { StatusCodes } = require('http-status-codes');

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return res.sendSuccess(
      data,
      'User registered successfully',
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    console.log(data);

    return res.sendSuccess(data, 'User Login successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

//  Logout

const logout = async (req, res, next) => {
  try {
    // can implement token blacklisting in future
    res.sendSuccess(null, 'User Logged Out Successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const forgetPassword = (req, res, next) => {
  return res
    .json({ message: 'Forget-Password', status: true })
    .status(StatusCodes.OK);
};

const resetPassword = (req, res, next) => {
  return res
    .json({ message: 'Reset Password', status: true })
    .status(StatusCodes.OK);
};

module.exports = {
  login,
  register,
  forgetPassword,
  resetPassword,
  logout,
};
