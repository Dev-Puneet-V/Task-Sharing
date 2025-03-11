import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Cookies from "js-cookie";
import { LoginForm } from "./components/auth/LoginForm";
import { RegisterForm } from "./components/auth/RegisterForm";
import { TaskList } from "./components/tasks/TaskList";
import { Navigation } from "./components/layout/Navigation";

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const token = Cookies.get("token");
  return token ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const token = Cookies.get("token");
  return !token ? <>{children}</> : <Navigate to="/tasks" />;
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
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
          <Route
            path="/"
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
          {/* Add more routes for friends and profile pages */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
