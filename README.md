# Task Tracker

A collaborative task management platform that allows users to create, share, and track tasks with friends.

## Features

- User Authentication (Email & Password)
- Task Management (CRUD operations)
- Friend System (Send/Accept/Reject friend requests)
- Task Sharing with Friends
- Real-time Status Updates

## Tech Stack

- Frontend:

  - React with TypeScript
  - Vite
  - Framer Motion for animations
  - Material-UI components
  - Heroicons
  - Axios for API calls

- Backend:
  - Node.js with Express
  - TypeScript
  - MongoDB with Mongoose
  - JWT Authentication
  - CORS enabled

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or remote instance)
- npm or yarn package manager

## Setup Instructions

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd task-tracker
   ```

2. Backend Setup:

   ```bash
   cd backend
   npm install
   cp .env.example .env  # Create and configure your environment variables
   npm run dev  # Start development server
   ```

3. Frontend Setup:

   ```bash
   cd frontend
   npm install
   npm run dev  # Start development server
   ```

4. Open your browser and navigate to `http://localhost:5173` to access the application.

## Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/task-tracker
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## API Endpoints

### Authentication

- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user

### Tasks

- GET /api/tasks - Get all tasks
- POST /api/tasks - Create new task
- PATCH /api/tasks/:id - Update task
- DELETE /api/tasks/:id - Delete task
- POST /api/tasks/:id/share - Share task with friend

### Friends

- POST /api/friends/request - Send friend request
- PATCH /api/friends/request/:userId - Accept/Reject friend request
- GET /api/friends/requests - Get friend requests
- GET /api/friends - Get friends list

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
