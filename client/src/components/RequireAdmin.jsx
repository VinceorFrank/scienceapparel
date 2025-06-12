import { Navigate, Outlet } from "react-router-dom";
import { isAdmin } from "../utils/auth";

const RequireAdmin = () => {
  return isAdmin() ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default RequireAdmin;
