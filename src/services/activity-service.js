const prisma = require('../lib/prisma');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const { ROLES } = require('../config/constants');

class ActivityService {
  async getActivityLogs(userRole) {
    try {
      const where = {};

      // If moderator, they can see all logs except admin's
      if (userRole === ROLES.MODERATOR) {
        where.user = {
          role: {
            name: {
              not: ROLES.ADMIN, // Exclude admin logs for moderators
            },
          },
        };
      }
      // If admin, they can see all logs
      return await prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new ActivityService();
