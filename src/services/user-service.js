const prisma = require('../lib/prisma');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const ResponseSanitizer = require('../utils/common/response-sanitizer');
const PasswordUtil = require('../utils/password');
const handleError = require('../utils/error/error-handler');
const { PERMISSIONS } = require('../config/constants');

const canModifyUser = async (modifyingUser, targetUser) => {
  // Self-modification is always allowed
  if (modifyingUser.id === targetUser.id) {
    return true;
  }

  // If both users have UPDATE_USER permission, they cannot modify each other
  const bothHaveUpdatePermission =
    modifyingUser.role.permissions.includes(PERMISSIONS.UPDATE_USER) &&
    targetUser.role.permissions.includes(PERMISSIONS.UPDATE_USER);

  if (bothHaveUpdatePermission) {
    return false;
  }

  // Check if modifying user has UPDATE_USER permission
  return modifyingUser.role.permissions.includes(PERMISSIONS.UPDATE_USER);
};
class UserService {
  async createUser(userData, creatorId) {
    try {
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
        include: { role: true },
      });

      if (!creator.role.permissions.includes(PERMISSIONS.CREATE_USER)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      // Only ADMIN can create users with elevated permissions
      if (userData.roleId) {
        const role = await prisma.role.findUnique({
          where: { id: userData.roleId },
          select: { name: true, permissions: true },
        });

        if (
          role.permissions.some((permission) =>
            [
              PERMISSIONS.UPDATE_USER,
              PERMISSIONS.DELETE_USER,
              PERMISSIONS.MANAGE_ROLES,
            ].includes(permission)
          ) &&
          creator.role.name !== 'ADMIN'
        ) {
          throw new AppError(
            'Cannot create user with elevated permissions',
            StatusCodes.FORBIDDEN
          );
        }
      }

      const hashedPassword = await PasswordUtil.hash(userData.password);

      const result = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            ...userData,
            password: hashedPassword,
          },
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'USER_CREATED',
            performedBy: creatorId,
            targetType: 'USER',
            targetId: newUser.id,
          },
        });

        return newUser;
      });

      return { user: ResponseSanitizer.sanitizeUser(result) };
    } catch (error) {
      handleError(error);
    }
  }

  async getUsers(includeAdmin = false) {
    try {
      const users = await prisma.user.findMany({
        include: {
          role: {
            select: {
              name: true,
              permissions: true,
            },
          },
        },
        where: includeAdmin
          ? {}
          : {
              role: {
                name: {
                  not: 'ADMIN',
                },
              },
            },
      });

      return { users: ResponseSanitizer.sanitizeUser(users) };
    } catch (error) {
      handleError(error);
    }
  }

  async getUserById(userId, jwtData) {
    try {
      const requestingUser = await prisma.user.findUnique({
        where: { id: jwtData.userId },
        include: { role: true },
      });

      if (!requestingUser) {
        throw new AppError(
          'Requesting user not found',
          StatusCodes.UNAUTHORIZED
        );
      }

      if (!requestingUser.role.permissions.includes(PERMISSIONS.READ_USER)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      const requestedUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              name: true,
              permissions: true,
            },
          },
        },
      });

      if (!requestedUser) {
        throw new AppError('User Not Found', StatusCodes.NOT_FOUND);
      }

      return { user: ResponseSanitizer.sanitizeUser(requestedUser) };
    } catch (error) {
      handleError(error);
    }
  }

  async updateUser(id, userData, updaterId) {
    try {
      const [userToUpdate, updatingUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id },
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        }),
        prisma.user.findUnique({
          where: { id: updaterId },
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        }),
      ]);

      if (!userToUpdate) {
        throw new AppError('User Not Found', StatusCodes.NOT_FOUND);
      }

      if (!updatingUser) {
        throw new AppError('Updating user not found', StatusCodes.NOT_FOUND);
      }

      // Check basic update permission
      if (!updatingUser.role.permissions.includes(PERMISSIONS.UPDATE_USER)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      // Check modification permissions using canModifyUser
      const hasPermission = await canModifyUser(updatingUser, userToUpdate);
      if (!hasPermission) {
        throw new AppError(
          'Cannot modify users with equal update permissions',
          StatusCodes.FORBIDDEN
        );
      }

      // Handle role change if roleId is provided
      if (userData.roleId && userData.roleId !== userToUpdate.roleId) {
        const newRole = await prisma.role.findUnique({
          where: { id: userData.roleId },
          select: { name: true, permissions: true },
        });

        if (!newRole) {
          throw new AppError('Invalid role specified', StatusCodes.BAD_REQUEST);
        }

        // Check if new role has UPDATE_USER permission
        if (
          newRole.permissions.includes(PERMISSIONS.UPDATE_USER) &&
          updatingUser.role.permissions.includes(PERMISSIONS.UPDATE_USER)
        ) {
          throw new AppError(
            'Cannot assign a role with equal update permissions',
            StatusCodes.FORBIDDEN
          );
        }

        // Prevent users from changing their own role
        if (updatingUser.id === userToUpdate.id) {
          throw new AppError('Cannot modify own role', StatusCodes.FORBIDDEN);
        }
      }

      // Handle password update if provided
      const hashedPassword = userData.password
        ? await PasswordUtil.hash(userData.password)
        : undefined;

      // Prepare update data
      const updateData = {
        ...userData,
        ...(hashedPassword && { password: hashedPassword }),
      };

      // Perform update within a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Update the user
        const updatedUser = await tx.user.update({
          where: { id },
          data: updateData,
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        });

        // Create activity log entry
        await tx.activityLog.create({
          data: {
            action: 'USER_UPDATED',
            performedBy: updaterId,
            targetType: 'USER',
            targetId: id,
            details: JSON.stringify({
              updatedFields: Object.keys(userData).filter(
                (key) => key !== 'password'
              ),
              roleChanged: userData.roleId ? true : false,
            }),
          },
        });

        return updatedUser;
      });

      // Return sanitized user data
      return {
        user: ResponseSanitizer.sanitizeUser(result),
        message: 'User updated successfully',
      };
    } catch (error) {
      handleError(error);
    }
  }

  async deleteUser(id, deleterId) {
    try {
      const [userToDelete, deletingUser] = await Promise.all([
        prisma.user.findUnique({
          where: { id },
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        }),
        prisma.user.findUnique({
          where: { id: deleterId },
          include: {
            role: {
              select: {
                name: true,
                permissions: true,
              },
            },
          },
        }),
      ]);

      if (!userToDelete) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
      }

      // Check basic delete permission
      if (!deletingUser.role.permissions.includes(PERMISSIONS.DELETE_USER)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      // Check modification permissions
      const hasPermission = await canModifyUser(deletingUser, userToDelete);
      if (!hasPermission) {
        throw new AppError(
          'Cannot delete users with equal or higher permissions',
          StatusCodes.FORBIDDEN
        );
      }

      // Additional admin-specific checks
      if (deletingUser.role.name === 'ADMIN') {
        // Prevent admin self-deletion
        if (deletingUser.id === userToDelete.id) {
          throw new AppError(
            'Admin cannot delete itself',
            StatusCodes.FORBIDDEN
          );
        }
        // Prevent admin-to-admin deletion
        if (userToDelete.role.name === 'ADMIN') {
          throw new AppError(
            'Admin cannot delete another admin',
            StatusCodes.FORBIDDEN
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.activityLog.deleteMany({
          where: {
            OR: [{ performedBy: id }, { targetId: id, targetType: 'USER' }],
          },
        });

        await tx.post.deleteMany({
          where: { userId: id },
        });

        await tx.user.delete({
          where: { id },
        });

        await tx.activityLog.create({
          data: {
            action: 'USER_DELETED',
            performedBy: deleterId,
            targetType: 'USER',
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

module.exports = new UserService();
