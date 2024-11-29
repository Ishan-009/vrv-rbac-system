const { z } = require('zod');
const { PERMISSIONS } = require('../config/constants');

// Authentication schemas
const registerSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(3, 'Password is required'),
  })
  .strict();

// User schemas
const createUserSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    roleId: z.string().uuid('Invalid role ID'),
  })
  .strict();

const updateUserSchema = z
  .object({
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    roleId: z.string().uuid('Invalid role ID'),
  })
  .strict();

// Role schemas
const createRoleSchema = z
  .object({
    name: z.string().min(2, 'Role name must be at least 2 characters'),
    permissions: z.array(z.enum(Object.values(PERMISSIONS))),
  })
  .strict();

const updateRoleSchema = z
  .object({
    name: z.string().min(2, 'Role name must be at least 2 characters'),
    permissions: z.array(z.enum(Object.values(PERMISSIONS))),
  })
  .strict();

// Post schemas
const createPostSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
  })
  .strict();

const updatePostSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters'),
  })
  .strict();

module.exports = {
  registerSchema,
  loginSchema,
  createUserSchema,
  updateUserSchema,
  createRoleSchema,
  updateRoleSchema,
  createPostSchema,
  updatePostSchema,
};
