const prisma = require('../lib/prisma');
const { ROLES } = require('../config/constants');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const ResponseSanitizer = require('../utils/common/response-sanitizer');
const PasswordUtil = require('../utils/password');
class UserService {
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

      const sanitizedUsers = ResponseSanitizer.sanitizeUser(users);
      return { users: sanitizedUsers };
    } catch (error) {
      // Proper error handling
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
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

      if (!user) {
        throw new AppError('User Not Found', StatusCodes.NOT_FOUND);
      }

      const sanitizedUser = ResponseSanitizer.sanitizeUser(user);

      return { user: sanitizedUser };
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

  async createUser(userData, creatorId) {
    try {
      const { username, email, password, roleId } = userData;

      // check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (existingUser) {
        throw new AppError('User Already Exists', StatusCodes.CONFLICT);
      }

      const role = await prisma.role.findUnique({
        where: {
          id: roleId,
        },
      });

      if (!role) {
        throw new AppError('Invalid Role / Role Not Found');
      }

      // hash password
      const hashedPassword = PasswordUtil.hash(password);

      // create user
      const user = await prisma.user.create({
        data: {
          email: email,
          username: username,
          password: hashedPassword,
          roleId: roleId,
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

      // Log Activity

      await prisma.activityLog.create({
        data: {
          action: 'USER_REGISTERED',
          performedBy: creatorId,
          targetType: 'USER',
          targetId: user.id,
        },
      });

      const sanitizedUser = ResponseSanitizer.sanitizeUser(user);

      return { user: sanitizedUser };
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

  async updateUser(id, userData, updaterId) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: id,
        },
      });

      if (!user) {
        throw new AppError('User Not Found', StatusCodes.NOT_FOUND);
      }

      if (!userData.roleId) {
        throw new AppError('Invalid Role', StatusCodes.BAD_REQUEST);
      }

      const updateData = { ...userData };

      // hashing the password
      const hashedPassword = await PasswordUtil.hash(userData.password);
      updateData.password = hashedPassword;

      // update user
      const updatedUser = await prisma.user.update({
        where: {
          id: id,
        },
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

      // log activity

      await prisma.activityLog.create({
        data: {
          action: 'USER_UPDATED',
          performedBy: updaterId,
          targetType: 'USER',
          targetId: id,
        },
      });

      // serealize user object

      const sanitizedUser = ResponseSanitizer.sanitizeUser(updatedUser);

      return { user: sanitizedUser };
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

  async deleteUser(id, deleterId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
      }

      // Use a transaction to ensure all operations complete or none do
      await prisma.$transaction(async (prisma) => {
        // First delete all activity logs associated with this user
        await prisma.activityLog.deleteMany({
          where: {
            OR: [
              { performedBy: id }, // Where user performed the action
              { targetId: id, targetType: 'USER' }, // Where user was the target
            ],
          },
        });

        // Then delete all posts by this user (if they exist)
        await prisma.post.deleteMany({
          where: {
            userId: id,
          },
        });

        // Finally delete the user
        await prisma.user.delete({
          where: { id },
        });
      });

      // Log the deletion activity (using the deleterId)
      await prisma.activityLog.create({
        data: {
          action: 'USER_DELETED',
          performedBy: deleterId,
          targetType: 'USER',
          targetId: id,
        },
      });

      return true;
    } catch (error) {
      // Proper error handling
      console.log(error);

      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new UserService();
