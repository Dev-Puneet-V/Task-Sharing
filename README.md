# Task-Sharing

A real-time collaborative task management platform that allows users to create, share, and track tasks with friends. Built with TypeScript, React, and Node.js.

## Features

### Task Management
- Create, edit, and delete tasks with title, description, due date, and priority
- Filter tasks by status (pending, in_progress, completed) and priority (low, medium, high)
- Tag-based task organization
- Real-time task status updates
- View tasks in a responsive grid layout

### Friend System
- Send and receive friend requests
- Accept/reject incoming friend requests
- Search for users by name or email
- Remove friends from your network
- View your friends list

### Task Sharing
- Share tasks with friends
- Real-time updates when shared tasks are modified
- View tasks shared with you in a separate tab
- Control over task sharing permissions

### Authentication & Security
- JWT-based authentication with secure cookie storage
- Protected API routes
- Email and password-based user registration
- Secure session management

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Heroicons for icons
- Axios for API calls
- WebSocket for real-time updates
- React Router for navigation

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- WebSocket server for real-time communication
- Cookie-based session management

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/Dev-Puneet-V/Task-Sharing.git
cd Task-Sharing
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Set up environment variables
Create a `.env` file in the backend directory with:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Install frontend dependencies
```bash
cd ../frontend
npm install
```

5. Start the development servers

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/stats` - Get task statistics

### Friends
- `POST /api/friends/request` - Send friend request
- `PATCH /api/friends/request/:userId` - Accept/reject friend request
- `GET /api/friends/requests` - Get friend requests
- `GET /api/friends` - Get friends list
- `DELETE /api/friends/:friendId` - Remove friend
- `GET /api/friends/shared-tasks` - Get tasks shared with me

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the [ISC License](LICENSE).