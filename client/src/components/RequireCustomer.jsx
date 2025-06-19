import { Navigate, Outlet } from "react-router-dom";

const RequireCustomer = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");

  if (!token || role !== "customer") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireCustomer;
