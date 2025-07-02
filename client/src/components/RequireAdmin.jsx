import { Navigate, Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/config";

const RequireAdmin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("token");
      console.log("RequireAdmin: token in localStorage:", token);

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      try {
        // Verify token and admin status with the server
        const response = await api.get("/users/auth/profile");
        console.log("RequireAdmin: full response", response.data);

        const user = response.data.data;
        console.log("RequireAdmin: extracted user", user);

        const isAdmin = user && user.isAdmin === true;
        console.log("RequireAdmin: isAdmin", isAdmin);

        if (!isAdmin) {
          // Clear invalid admin session
          localStorage.clear();
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        // Clear invalid session
        localStorage.clear();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAdmin();
  }, []);

  console.log("RequireAdmin: isLoading:", isLoading, "isAuthenticated:", isAuthenticated);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
