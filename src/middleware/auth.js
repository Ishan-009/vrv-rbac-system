const JWTUtil = require('../utils/jwt');
const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.sendError(
        'Token Not Found',
        'Token Not Found',
        StatusCodes.UNAUTHORIZED
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.sendError('Token Not Found', StatusCodes.UNAUTHORIZED);
    }
    const decoded = await JWTUtil.verifyToken(token);

    // Store user info in request
    req.user = decoded; // Contains userId and role
    next();
  } catch (error) {
    return res.sendError(
      'Invalid or expired token',
      null,
      StatusCodes.UNAUTHORIZED
    );
  }
};

const hasPermission = (requiredPermissions) => {
  const permissions = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  return async (req, res, next) => {
    try {
      const role = await prisma.role.findFirst({
        where: { name: req.user.role },
      });

      if (!role) {
        return res.sendError('Role not found', null, StatusCodes.FORBIDDEN);
      }

      const hasRequired = permissions.every((permission) =>
        role.permissions.includes(permission)
      );

      if (!hasRequired) {
        return res.sendError(
          'Insufficient permissions',
          null,
          StatusCodes.FORBIDDEN
        );
      }

      next();
    } catch (error) {
      return res.sendError(
        'Permission check failed',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };
};

module.exports = { authenticate, hasPermission };
