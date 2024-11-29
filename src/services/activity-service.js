const prisma = require('../lib/prisma');
const { ROLES } = require('../config/constants');
const handleError = require('../utils/error/error-handler');

class ActivityService {
  async getActivityLogs(userRole) {
    try {
      const where = {};

      // If moderator, they can see all logs except admin's
      if (userRole === ROLES.MODERATOR) {
        where.user = {
          role: {
            name: {
              not: ROLES.ADMIN,
            },
          },
        };
      }

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
      handleError(error);
    }
  }
}

module.exports = new ActivityService();
