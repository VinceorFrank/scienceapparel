import { Navigate, Outlet } from "react-router-dom";

const RequireCustomer = () => {
  const token = localStorage.getItem("token");

  // You can customize this to check token validity later
  if (!token) {
    return <Navigate to="/customer/login" replace />;
  }

  return <Outlet />;
};

export default RequireCustomer;
