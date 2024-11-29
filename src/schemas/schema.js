const { z } = require('zod');
const { PERMISSIONS } = require('../config/constants');

// Authentication schemas
const registerSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .trim()
      .max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password cannot exceed 100 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must include uppercase, lowercase, number and special character'
      ),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username cannot exceed 50 characters')
      .trim(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().email('Invalid email format').trim(),
    password: z.string().min(1, 'Password is required'),
  })
  .strict();

// User schemas
const createUserSchema = z
  .object({
    email: z
      .string()
      .email('Invalid email format')
      .trim()
      .max(255, 'Email cannot exceed 255 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must include uppercase, lowercase, number and special character'
      ),
    username: z.string().min(3).max(50).trim(),
    roleId: z.string().uuid('Invalid role ID'),
  })
  .strict();

const updateUserSchema = z
  .object({
    email: z.string().email('Invalid email format').trim(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
        'Password must include uppercase, lowercase, number and special character'
      ),
    username: z.string().min(3).max(50).trim(),
    roleId: z.string().uuid('Invalid role ID'),
  })
  .strict();

// Role schemas
const createRoleSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Role name must be at least 2 characters')
      .max(50, 'Role name cannot exceed 50 characters')
      .regex(/^[A-Z_]+$/, 'Role name must be uppercase with underscores only'),
    permissions: z
      .array(z.enum(Object.values(PERMISSIONS)))
      .min(1, 'At least one permission is required'),
  })
  .strict();

const updateRoleSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Role name must be at least 2 characters')
      .max(50, 'Role name cannot exceed 50 characters')
      .regex(/^[A-Z_]+$/, 'Role name must be uppercase with underscores only'),
    permissions: z
      .array(z.enum(Object.values(PERMISSIONS)))
      .min(1, 'At least one permission is required'),
  })
  .strict();

// Post schemas
const createPostSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title cannot exceed 255 characters')
      .trim(),
    content: z
      .string()
      .min(10, 'Content must be at least 10 characters')
      .trim(),
  })
  .strict();

const updatePostSchema = z
  .object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .max(255, 'Title cannot exceed 255 characters')
      .trim(),
    content: z
      .string()
      .min(10, 'Content must be at least 10 characters')
      .trim(),
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
