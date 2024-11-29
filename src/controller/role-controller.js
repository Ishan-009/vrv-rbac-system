const roleService = require('../services/role-service');
const { StatusCodes } = require('http-status-codes');

const getRoles = async (req, res, next) => {
  try {
    const roles = await roleService.getRoles();
    return res.sendSuccess(roles, 'Role Data', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const getRoleById = async (req, res, next) => {
  try {
    const role = await roleService.getRoleById(req.params.id);
    return res.sendSuccess(role, 'Role Data', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole(req.body, req.user.userId);
    return res.sendSuccess(
      role,
      'Role Created Successfully',
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole(
      req.params.id,
      req.body,
      req.user.userId
    );
    return res.sendSuccess(role, 'Role Updated Successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const deleteRole = async (req, res, next) => {
  try {
    const result = await roleService.deleteRole(req.params.id, req.user.userId);

    return res.sendSuccess(null, 'Role Deleted Successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  deleteRole,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
};
