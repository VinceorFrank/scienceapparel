export const logout = () => {
  localStorage.removeItem("token");
  window.location.href = "/admin/login";
};
