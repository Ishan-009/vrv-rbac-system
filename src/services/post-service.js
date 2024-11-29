const prisma = require('../lib/prisma');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const { ROLES } = require('../config/constants');
class PostService {
  async getPosts(userId, userRole) {
    try {
      // admin and moderator can see all the posts
      if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
        return await prisma.post.findMany({
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
      }

      // normal users can see their own post
      return await prisma.post.findMany({
        where: {
          userId: userId,
        },

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
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getPostById(postId, userId, userRole) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
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
      });

      if (!post) {
        throw new AppError('Post Not Found', StatusCodes.NOT_FOUND);
      }

      // Check if user has permission to view this post
      if (
        userRole !== ROLES.ADMIN &&
        userRole !== ROLES.MODERATOR &&
        post.userId !== userId
      ) {
        throw new AppError('You do not have permission to view this post', 403);
      }

      return post;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createPost(data, userId) {
    try {
      const post = await prisma.post.create({
        data: {
          ...data,
          userId,
        },
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
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'POST_CREATED',
          performedBy: userId,
          targetType: 'POST',
          targetId: post.id,
        },
      });

      return post;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async updatePost(postId, data, userId, userRole) {
    try {
      const post = await prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new AppError('Post not found', StatusCodes.NOT_FOUND);
      }

      // Check if user has permission to update this post
      if (
        userRole !== ROLES.ADMIN &&
        userRole !== ROLES.MODERATOR &&
        post.userId !== userId
      ) {
        throw new AppError('Insufficient Permissions', StatusCodes.FORBIDDEN);
      }

      const updatedPost = await prisma.post.update({
        where: { id: postId },
        data,
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
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'POST_UPDATED',
          performedBy: userId,
          targetType: 'POST',
          targetId: postId,
        },
      });

      return updatedPost;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Internal Server Error',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deletePost(postId, userId, userRole) {
    try {
      const post = await prisma.post.findFirst({
        where: { id: postId },
      });

      if (!post) {
        throw new AppError('Post not found', StatusCodes.NOT_FOUND);
      }

      // Check if user has permission to delete this post
      if (
        userRole !== ROLES.ADMIN &&
        userRole !== ROLES.MODERATOR &&
        post.userId !== userId
      ) {
        throw new AppError('Insufficient Permissions', StatusCodes.FORBIDDEN);
      }

      await prisma.post.delete({
        where: { id: postId },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'POST_DELETED',
          performedBy: userId,
          targetType: 'POST',
          targetId: postId,
        },
      });

      return true;
    } catch (error) {
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

module.exports = new PostService();
