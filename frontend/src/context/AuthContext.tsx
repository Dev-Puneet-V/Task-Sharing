import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import api from "../utils/axios";

interface User {
  _id: string;
  name: string;
  email: string;
  friends: string[];
  friendRequests: Array<{
    from: string;
    status: "pending" | "accepted" | "rejected";
  }>;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!Cookies.get("token")
  );
  const [user, setUser] = useState<User | null>(null);

  // Fetch user data if authenticated
  useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated && !user) {
        try {
          const { data } = await api.get("/auth/me");
          setUser(data);
        } catch (error) {
          console.error("Error fetching user:", error);
          logout();
        }
      }
    };

    fetchUser();
  }, [isAuthenticated]);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      console.log(data);
      // The cookie will be automatically set by the browser due to our backend configuration
      setIsAuthenticated(true);
      setUser(data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const { data } = await api.post("/auth/register", {
        name,
        email,
        password,
      });

      // The cookie will be automatically set by the browser due to our backend configuration
      setIsAuthenticated(true);
      setUser(data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "Registration failed");
    }
  };

  const logout = () => {
    api
      .post("/auth/logout")
      .then(() => {
        // Cookie will be removed by the backend
        setIsAuthenticated(false);
        setUser(null);
      })
      .catch((error) => {
        console.error("Error during logout:", error);
      });
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
