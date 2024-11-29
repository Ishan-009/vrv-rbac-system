const userService = require('../services/user-service');
const { StatusCodes } = require('http-status-codes');

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.user.role === 'ADMIN');
    return res.sendSuccess(users, 'Users Data', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user);
    return res.sendSuccess(user, 'User Data', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.user.userId);
    return res.sendSuccess(
      user,
      'User Created successfully',
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(
      req.params.id,
      req.body,
      req.user.userId
    );
    return res.sendSuccess(user, 'User Updated Successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const user = await userService.deleteUser(req.params.id, req.user.userId);
    return res.sendSuccess(null, 'User Deleted successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteUser,
  createUser,
  getUserById,
  getUsers,
  updateUser,
};
