# Role-Based Access Control (RBAC) System

## Overview

This project implements a Role-Based Access Control (RBAC) system for managing user authentication, authorization, and access permissions. It provides a secure and scalable solution for controlling user access to resources based on their assigned roles.

## Key Features

User authentication system with registration, login, and logout functionality
Role-based access control with three main default roles (Admin, Moderator, User) and can also create custom roles
Permission-based authorization for controlling access to routes and resources

Role hierarchy system:

Admins can manage all users,roles, post including activity-logs of all the system

Moderators can view/update user/posts of user role, see activity logs of system except admin activity logs,

Users have access to their own resources only

Same Permission Access users cannot modify each other , like moderator who is having update user permission cannot modify tester who has same update user permission they cannot modify each other , same for update_post, they can perform operations on lower heirarchical roles such as general user role. (Refer API Documentation || VIEW config/constants.js file)

Each role has its own permissions and its scope to which it can execute the permissions into the project.

Activity logging to track user actions and system events

Permission management:

Each role has specific permissions
Permissions define what actions users can perform
Easy to add new permissions as needed

Secure authentication using JWT tokens
Clean API endpoints for user and role management

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JSON Web Tokens (JWT)

## Project Structure

- `config/`: Configuration files
- `controllers/`: Controller functions handling requests and responses
- `lib/`: Reusable utility modules
- `middlewares/`: Custom middleware for authentication, permissions, error handling
- `routes/`: API route definitions
- `schemas/`: Request validation schemas
- `services/`: Business logic and database interactions
- `utils/`: Utility functions and helpers
- `prisma/`: Prisma ORM schema and migrations

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file refer .env.example file
4. Run Command npx prisma init
5. Run database migrations: `npx prisma migrate dev`
6. Seed the database: `npx prisma db seed`
7. Run Prisma Client Generate Command:- npx prisma generate
8. Start the server: `nodemon src/index.js`

The API server will run at `http://localhost:3000`.

## API Endpoints

`/api/v1/healthy`: Healthy Server Endpoint

- `/api/v1/auth`: User registration, login, logout
- `/api/v1/users`: User management
- `/api/v1/roles`: Role management
- `/api/v1/posts`: Post management
- `/api/v1/activity`: Activity logging

Refer to the API documentation for detailed information on request/response formats and authorization requirements.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request following the existing code style and conventions.

## License

This project is licensed under the MIT License.
