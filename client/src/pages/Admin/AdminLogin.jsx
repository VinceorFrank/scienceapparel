import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/config";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log('Attempting login with:', { email });
    
    try {
      console.log('Making API request to:', api.defaults.baseURL + '/users/login');
      const res = await api.post("/users/login", {
        email,
        password,
      });

      console.log('Login response:', res.data);
      const { user, token } = res.data.data;

      // Check if user exists and is admin
      if (!user || !user.isAdmin) {
        console.log('User validation failed:', { user });
        setError("Access denied. Admin privileges required.");
        setIsLoading(false);
        return;
      }

      console.log('Storing user data in localStorage');
      // Store user info and token
      localStorage.setItem("token", token);
      localStorage.setItem("userName", user.name);
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userRole", user.role);
      localStorage.setItem("isAdmin", user.isAdmin.toString());

      console.log('Navigating to dashboard');
      // Force a full page reload to /admin/dashboard
      window.location.href = "/admin/dashboard";
    } catch (err) {
      console.error("Login error details:", {
        error: err,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      
      if (err.response?.status === 400) {
        setError(err.response.data.message || "Invalid credentials");
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError("An error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <button 
          type="submit" 
          className={`w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
