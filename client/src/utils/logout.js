export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
  
  // Redirect based on role
  const role = localStorage.getItem("userRole");
  if (role === "admin") {
    window.location.href = "/admin/login";
  } else {
    window.location.href = "/login";
  }
};
