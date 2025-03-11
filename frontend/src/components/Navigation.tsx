import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ListBulletIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

const Navigation: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-4">
            <Link
              to="/"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <ListBulletIcon className="h-5 w-5 mr-2" />
              Tasks
            </Link>
            <Link
              to="/friends"
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                isActive("/friends")
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <UserGroupIcon className="h-5 w-5 mr-2" />
              Friends
            </Link>
          </div>
          <button
            onClick={logout}
            className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
