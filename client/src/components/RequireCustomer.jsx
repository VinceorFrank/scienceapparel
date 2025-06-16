import { Navigate, Outlet } from "react-router-dom";

const RequireCustomer = () => {
  const token = localStorage.getItem("customerToken");

  // You can customize this to check token validity later
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireCustomer;
