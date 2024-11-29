const prisma = require('../lib/prisma');
const { ROLES, PERMISSIONS } = require('../config/constants');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const handleError = require('../utils/error/error-handler');

class RoleService {
  // View operations - requires READ_USER permission
  async getRoles() {
    try {
      return await prisma.role.findMany();
    } catch (error) {
      handleError(error);
    }
  }

  async getRoleById(id) {
    try {
      const role = await prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new AppError('Role Not Found', StatusCodes.NOT_FOUND);
      }

      return role;
    } catch (error) {
      handleError(error);
    }
  }

  async createRole(roleData, creatorId) {
    try {
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
        include: { role: true },
      });

      if (!creator) {
        throw new AppError('Creator not found', StatusCodes.UNAUTHORIZED);
      }

      if (!creator.role.permissions.includes(PERMISSIONS.MANAGE_ROLES)) {
        throw new AppError(
          'Permission denied: Requires role management access',
          StatusCodes.FORBIDDEN
        );
      }

      const roleExist = await prisma.role.findUnique({
        where: { name: roleData.name },
      });

      if (roleExist) {
        throw new AppError('Role Already Exists', StatusCodes.CONFLICT);
      }

      return await prisma.$transaction(async (tx) => {
        const role = await tx.role.create({
          data: roleData,
        });

        await tx.activityLog.create({
          data: {
            action: 'ROLE_CREATED',
            performedBy: creatorId,
            targetType: 'ROLE',
            targetId: role.id,
          },
        });

        return role;
      });
    } catch (error) {
      handleError(error);
    }
  }

  async updateRole(id, roleData, updaterId) {
    try {
      const [roleToUpdate, updatingUser] = await Promise.all([
        prisma.role.findUnique({
          where: { id },
        }),
        prisma.user.findUnique({
          where: { id: updaterId },
          include: { role: true },
        }),
      ]);

      if (!roleToUpdate) {
        throw new AppError('Role not found', StatusCodes.NOT_FOUND);
      }

      if (!updatingUser.role.permissions.includes(PERMISSIONS.MANAGE_ROLES)) {
        throw new AppError(
          'Permission denied: Requires role management access',
          StatusCodes.FORBIDDEN
        );
      }

      // Special protection for ADMIN role
      if (roleToUpdate.name === 'ADMIN' && roleData.permissions) {
        throw new AppError(
          'Cannot modify ADMIN role permissions',
          StatusCodes.UNAUTHORIZED
        );
      }

      return await prisma.$transaction(async (tx) => {
        const updatedRole = await tx.role.update({
          where: { id },
          data: roleData,
        });

        await tx.activityLog.create({
          data: {
            action: 'ROLE_UPDATED',
            performedBy: updaterId,
            targetType: 'ROLE',
            targetId: id,
          },
        });

        return updatedRole;
      });
    } catch (error) {
      handleError(error);
    }
  }

  async deleteRole(id, deleterId) {
    try {
      const [roleToDelete, deletingUser] = await Promise.all([
        prisma.role.findUnique({
          where: { id },
        }),
        prisma.user.findUnique({
          where: { id: deleterId },
          include: { role: true },
        }),
      ]);

      if (!roleToDelete) {
        throw new AppError('Role not found', StatusCodes.NOT_FOUND);
      }

      if (!deletingUser.role.permissions.includes(PERMISSIONS.MANAGE_ROLES)) {
        throw new AppError(
          'Permission denied: Requires role management access',
          StatusCodes.FORBIDDEN
        );
      }

      // Protect default system roles
      if (
        roleToDelete.name === 'ADMIN' ||
        roleToDelete.name === 'USER' ||
        roleToDelete.name === 'MODERATOR'
      ) {
        throw new AppError(
          'Cannot delete default system roles',
          StatusCodes.FORBIDDEN
        );
      }

      const usersWithRole = await prisma.user.count({
        where: { roleId: id },
      });

      if (usersWithRole > 0) {
        throw new AppError(
          'Cannot delete role assigned to users',
          StatusCodes.CONFLICT
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.role.delete({
          where: { id },
        });

        await tx.activityLog.create({
          data: {
            action: 'ROLE_DELETED',
            performedBy: deleterId,
            targetType: 'ROLE',
            targetId: id,
          },
        });
      });

      return true;
    } catch (error) {
      handleError(error);
    }
  }
}

module.exports = new RoleService();
