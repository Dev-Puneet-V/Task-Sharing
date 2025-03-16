import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Navigation } from "./components/layout/Navigation";
import Skeleton from "./components/common/Skeleton";

// Lazy load components
const LandingPage = lazy(() => import("./components/landing/LandingPage"));
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const RegisterForm = lazy(() => import("./components/auth/RegisterForm"));
const TaskList = lazy(() => import("./components/tasks/TaskList"));
const FriendsList = lazy(() => import("./components/friends/FriendsList"));
const UserProfile = lazy(() => import("./components/profile/UserProfile"));
const Dashboard = lazy(() => import("./components/dashboard/Dashboard"));

// Loading fallback component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-full max-w-md">
      <Skeleton height="400px" className="rounded-lg" />
    </div>
  </div>
);

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/tasks" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <NotificationProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Public routes */}
                <Route
                  path="/"
                  element={
                    <PublicRoute>
                      <LandingPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginForm />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <RegisterForm />
                    </PublicRoute>
                  }
                />

                {/* Private routes */}
                <Route
                  path="/tasks"
                  element={
                    <PrivateRoute>
                      <div>
                        <Navigation />
                        <TaskList />
                      </div>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={<Navigate to="/tasks" replace />}
                />
                <Route
                  path="/friends"
                  element={
                    <PrivateRoute>
                      <div>
                        <Navigation />
                        <FriendsList />
                      </div>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <div>
                        <Navigation />
                        <UserProfile />
                      </div>
                    </PrivateRoute>
                  }
                />

                {/* Catch-all route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </NotificationProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
};

export default App;
