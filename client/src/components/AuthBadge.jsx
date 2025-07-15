import React from "react";
import { useNavigate } from "react-router-dom";

const AuthBadge = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const name = localStorage.getItem("userName");

  if (!token) return null;          // hide when logged-out

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <button
        onClick={() => navigate('/account')}
        className="text-green-600 hover:text-green-700 hover:underline transition-colors cursor-pointer"
      >
        ✓ {name}
      </button>
      <button
        onClick={logout}
        className="px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
      >
        Logout
      </button>
    </div>
  );
};

export default AuthBadge; 