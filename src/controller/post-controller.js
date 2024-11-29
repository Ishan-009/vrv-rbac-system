const { StatusCodes } = require('http-status-codes');
const postService = require('../services/post-service');
const getPosts = async (req, res, next) => {
  try {
    const posts = await postService.getPosts(req.user.userId, req.user.role);
    return res.sendSuccess(posts, 'Posts Data', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const post = await postService.getPostById(
      req.params.id,
      req.user.userId,
      req.user.role
    );
    return res.sendSuccess(post, 'Post Data', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    const post = await postService.createPost(req.body, req.user.userId);
    return res.sendSuccess(
      post,
      'Post Created Successfully',
      StatusCodes.CREATED
    );
  } catch (error) {
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const post = await postService.updatePost(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );
    return res.sendSuccess(post, 'Post Updated Successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const result = await postService.deletePost(
      req.params.id,
      req.user.userId,
      req.user.role
    );

    return res.sendSuccess(null, 'Post Deleted Successfully', StatusCodes.OK);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
};
