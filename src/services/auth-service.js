const prisma = require('../lib/prisma');
const { ROLES } = require('../config/constants');
const PasswordUtil = require('../utils/password');
const JWTUtil = require('../utils/jwt');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const ResponseSanitizer = require('../utils/common/response-sanitizer');
const handleError = require('../utils/error/error-handler');

class AuthService {
  async register(userData) {
    try {
      const { username, email, password } = userData;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new AppError('User Already Exists', StatusCodes.CONFLICT);
      }

      const userRole = await prisma.role.findUnique({
        where: { name: ROLES.USER },
      });

      if (!userRole) {
        throw new AppError('Default role not found', StatusCodes.NOT_FOUND);
      }

      const hashedPassword = await PasswordUtil.hash(password);

      // Using transaction for user creation, activity logging, and token generation
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            username,
            roleId: userRole.id,
          },
          select: {
            id: true,
            username: true,
            email: true,
            role: {
              select: {
                id: true,
                name: true,
                permissions: true,
              },
            },
          },
        });

        await tx.activityLog.create({
          data: {
            action: 'USER_REGISTERED',
            performedBy: user.id,
            targetType: 'USER',
            targetId: user.id,
          },
        });

        const token = await JWTUtil.generateToken({
          userId: user.id,
          role: user.role.name,
        });

        return { user, token };
      });

      return {
        user: ResponseSanitizer.sanitizeUser(result.user),
        token: result.token,
      };
    } catch (error) {
      handleError(error);
    }
  }

  async login(userData) {
    try {
      const { email, password } = userData;

      const user = await prisma.user.findFirst({
        where: { email },
        select: {
          username: true,
          email: true,
          password: true,
          id: true,
          role: {
            select: {
              name: true,
              permissions: true,
            },
          },
        },
      });

      if (!user) {
        throw new AppError('User does not exist', StatusCodes.NOT_FOUND);
      }

      const isValid = await PasswordUtil.verify(password, user.password);

      if (!isValid) {
        throw new AppError('Invalid Credentials', StatusCodes.UNAUTHORIZED);
      }

      // Using transaction for activity logging and token generation
      const result = await prisma.$transaction(async (tx) => {
        await tx.activityLog.create({
          data: {
            action: 'USER_LOGIN',
            performedBy: user.id,
            targetType: 'USER',
            targetId: user.id,
          },
        });

        const token = await JWTUtil.generateToken({
          userId: user.id,
          role: user.role.name,
        });

        return { user, token };
      });

      return {
        user: ResponseSanitizer.sanitizeUser(result.user),
        token: result.token,
      };
    } catch (error) {
      handleError(error);
    }
  }
}

module.exports = new AuthService();
