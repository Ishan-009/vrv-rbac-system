const prisma = require('../lib/prisma');
const { ROLES } = require('../config/constants');
const PasswordUtil = require('../utils/password');
const JWTUtil = require('../utils/jwt');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const ResponseSanitizer = require('../utils/common/response-sanitizer');
class AuthService {
  async register(userData) {
    try {
      const { username, email, password } = userData;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (existingUser) {
        throw new AppError('User Already Exists', StatusCodes.CONFLICT);
      }

      // Get the default USER role
      const userRole = await prisma.role.findUnique({
        where: { name: ROLES.USER },
      });

      if (!userRole) {
        throw new AppError('Default role not found', StatusCodes.NOT_FOUND);
      }

      // Hash password - make sure to await it
      const hashedPassword = await PasswordUtil.hash(password);

      // Create new user
      const user = await prisma.user.create({
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

      // Create activity log for the new user
      await prisma.activityLog.create({
        data: {
          action: 'USER_REGISTERED',
          performedBy: user.id,
          targetType: 'USER',
          targetId: user.id,
        },
      });

      // Generate token with the new user's information
      const token = await JWTUtil.generateToken({
        userId: user.id,
        role: user.role.name,
      });

      const sanitizedUser = ResponseSanitizer.sanitizeUser(user);
      return { user: sanitizedUser, token };
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

  async login(userData) {
    try {
      const { email, password } = userData;

      // check if user exist or not

      const user = await prisma.user.findFirst({
        where: {
          email: email,
        },
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

      // validate password
      const isValid = await PasswordUtil.verify(password, user.password);

      if (!isValid) {
        throw new AppError('Invalid Credentials', StatusCodes.UNAUTHORIZED);
      }

      // Log Activity
      await prisma.activityLog.create({
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

      const santizedUser = ResponseSanitizer.sanitizeUser(user);
      return { user: santizedUser, token };
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
}

module.exports = new AuthService();
