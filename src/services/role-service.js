const prisma = require('../lib/prisma');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
// const ResponseSanitizer = require('../utils/common/response-sanitizer');

class RoleService {
  async getRoles() {
    try {
      return await prisma.role.findMany();
    } catch (error) {
      // Proper error handling
      if (error instanceof AppError) {
        throw error;
      }
      console.log(error);
      throw new AppError(
        'Interval Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getRoleById(id) {
    try {
      // check if roleId/role exist or not
      const role = await prisma.role.findUnique({
        where: {
          id: id,
        },
      });

      if (!role) {
        throw new AppError('Role Not Found', StatusCodes.NOT_FOUND);
      }

      return role;
    } catch (error) {
      // Proper error handling
      if (error instanceof AppError) {
        throw error;
      }
      console.log(error);
      throw new AppError(
        'Interval Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createRole(roleData, creatorId) {
    try {
      // check if role already exist or not

      const roleExist = await prisma.role.findUnique({
        where: {
          name: roleData.name,
        },
      });

      if (roleExist) {
        throw new AppError('Role Already Exists', StatusCodes.CONFLICT);
      }

      const role = await prisma.role.create({
        data: roleData,
      });

      // log activity

      await prisma.activityLog.create({
        data: {
          action: 'ROLE_CREATED',
          performedBy: creatorId,
          targetType: 'ROLE',
          targetId: role.id,
        },
      });

      return role;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.log(error);
      throw new AppError(
        'Interval Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updateRole(id, roleData, updaterId) {
    try {
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new AppError('Role not found', StatusCodes.NOT_FOUND);
      }

      if (role.name === 'ADMIN' && roleData.permissions) {
        throw new AppError(
          'Cannot modify ADMIN role permissions',
          StatusCodes.UNAUTHORIZED
        );
      }

      const updatedRole = await prisma.role.update({
        where: { id },
        data: roleData,
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'ROLE_UPDATED',
          performedBy: updaterId,
          targetType: 'ROLE',
          targetId: id,
        },
      });

      return updatedRole;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.log(error);
      throw new AppError(
        'Interval Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteRole(id, deleterId) {
    try {
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new AppError('Role not found', StatusCodes.NOT_FOUND);
      }

      if (role.name === 'ADMIN' || role.name === 'USER') {
        throw new AppError('Cannot delete system roles', StatusCodes.FORBIDDEN);
      }

      // Check if role is assigned to any users
      const usersWithRole = await prisma.user.count({
        where: { roleId: id },
      });

      if (usersWithRole > 0) {
        throw new AppError(
          'Cannot delete role assigned to users',
          StatusCodes.CONFLICT
        );
      }

      await prisma.role.delete({
        where: { id },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'ROLE_DELETED',
          performedBy: deleterId,
          targetType: 'ROLE',
          targetId: id,
        },
      });

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.log(error);
      throw new AppError(
        'Interval Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new RoleService();
