const prisma = require('../lib/prisma');
const AppError = require('../utils/error/app-error');
const { StatusCodes } = require('http-status-codes');
const { PERMISSIONS, ROLES } = require('../config/constants');
const handleError = require('../utils/error/error-handler');

const canModifyPost = async (modifyingUser, post) => {
  try {
    // First, get post owner's details
    const postOwner = await prisma.user.findUnique({
      where: { id: post.userId },
      include: {
        role: {
          select: {
            name: true,
            permissions: true,
          },
        },
      },
    });

    // Self-modification is always allowed
    if (modifyingUser.id === post.userId) {
      return true;
    }

    // Admin can modify any post except other admin's posts
    if (modifyingUser.role.name === ROLES.ADMIN) {
      return (
        postOwner.role.name !== ROLES.ADMIN || modifyingUser.id === post.userId
      );
    }

    // If both users have UPDATE_POST permission, they cannot modify each other's posts
    const bothHaveUpdatePermission =
      modifyingUser.role.permissions.includes(PERMISSIONS.UPDATE_POST) &&
      postOwner.role.permissions.includes(PERMISSIONS.UPDATE_POST);

    if (bothHaveUpdatePermission) {
      return false;
    }

    // User with UPDATE_POST permission can modify posts of users without it
    return modifyingUser.role.permissions.includes(PERMISSIONS.UPDATE_POST);
  } catch (error) {
    handleError(error);
  }
};

class PostService {
  async getPosts(userId, userRole) {
    try {
      const user = await prisma.user.findUnique({
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

      if (!user.role.permissions.includes(PERMISSIONS.READ_POST)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      const includeOptions = {
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
      };

      // Admin and moderator can see all posts
      if ([ROLES.ADMIN, ROLES.MODERATOR].includes(user.role.name)) {
        return await prisma.post.findMany({
          include: includeOptions,
          orderBy: {
            createdAt: 'desc',
          },
        });
      }

      // Regular users can only see their own posts
      return await prisma.post.findMany({
        where: { userId },
        include: includeOptions,
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      handleError(error);
    }
  }

  async getPostById(postId, userId, userRole) {
    try {
      const user = await prisma.user.findUnique({
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

      if (!user.role.permissions.includes(PERMISSIONS.READ_POST)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

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
                  permissions: true,
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
        ![ROLES.ADMIN, ROLES.MODERATOR].includes(user.role.name) &&
        post.userId !== userId
      ) {
        throw new AppError(
          'You do not have permission to view this post',
          StatusCodes.FORBIDDEN
        );
      }

      return post;
    } catch (error) {
      handleError(error);
    }
  }

  async createPost(data, userId) {
    try {
      const user = await prisma.user.findUnique({
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

      if (!user.role.permissions.includes(PERMISSIONS.CREATE_POST)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      return await prisma.$transaction(async (tx) => {
        const post = await tx.post.create({
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

        await tx.activityLog.create({
          data: {
            action: 'POST_CREATED',
            performedBy: userId,
            targetType: 'POST',
            targetId: post.id,
          },
        });

        return post;
      });
    } catch (error) {
      handleError(error);
    }
  }

  async updatePost(postId, data, userId) {
    try {
      // Get both the post and updating user's details in parallel
      const [post, updatingUser] = await Promise.all([
        prisma.post.findUnique({
          where: { id: postId },
          include: {
            user: {
              select: {
                id: true,
                role: {
                  select: {
                    name: true,
                    permissions: true,
                  },
                },
              },
            },
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
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

      if (!post) {
        throw new AppError('Post not found', StatusCodes.NOT_FOUND);
      }

      if (!updatingUser) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
      }

      // Check basic update permission
      if (!updatingUser.role.permissions.includes(PERMISSIONS.UPDATE_POST)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      // Check modification permissions
      const hasPermission = await canModifyPost(updatingUser, post);
      if (!hasPermission) {
        throw new AppError(
          'Cannot modify posts from users with equal update permissions',
          StatusCodes.FORBIDDEN
        );
      }

      // Remove any sensitive or system fields from update data
      const updateData = { ...data };
      delete updateData.id;
      delete updateData.userId;
      delete updateData.createdAt;
      delete updateData.updatedAt;

      // Perform update within transaction
      return await prisma.$transaction(async (tx) => {
        const updatedPost = await tx.post.update({
          where: { id: postId },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
                role: {
                  select: {
                    name: true,
                    permissions: true,
                  },
                },
              },
            },
          },
        });

        // Log the activity
        await tx.activityLog.create({
          data: {
            action: 'POST_UPDATED',
            performedBy: userId,
            targetType: 'POST',
            targetId: postId,
            details: JSON.stringify({
              updatedFields: Object.keys(data),
            }),
          },
        });

        return updatedPost;
      });
    } catch (error) {
      handleError(error);
    }
  }

  async deletePost(postId, userId, userRole) {
    try {
      const [post, deletingUser] = await Promise.all([
        prisma.post.findUnique({
          where: { id: postId },
          include: {
            user: {
              select: {
                role: true,
              },
            },
          },
        }),
        prisma.user.findUnique({
          where: { id: userId },
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

      if (!post) {
        throw new AppError('Post not found', StatusCodes.NOT_FOUND);
      }

      // Check basic delete permission
      if (!deletingUser.role.permissions.includes(PERMISSIONS.DELETE_POST)) {
        throw new AppError('Permission denied', StatusCodes.FORBIDDEN);
      }

      // Check hierarchical permissions
      const hasPermission = await canModifyPost(deletingUser, post);
      if (!hasPermission) {
        throw new AppError(
          'Cannot delete posts from users with equal or higher permissions',
          StatusCodes.FORBIDDEN
        );
      }

      await prisma.$transaction(async (tx) => {
        await tx.post.delete({
          where: { id: postId },
        });

        await tx.activityLog.create({
          data: {
            action: 'POST_DELETED',
            performedBy: userId,
            targetType: 'POST',
            targetId: postId,
          },
        });
      });

      return true;
    } catch (error) {
      handleError(error);
    }
  }
}

module.exports = new PostService();
