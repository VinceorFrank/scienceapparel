export const getToken = () => localStorage.getItem("token");

export const isLoggedIn = () => !!getToken();

export const isAdmin = () => localStorage.getItem("userRole") === "admin";

export const isCustomer = () => localStorage.getItem("userRole") === "customer";

export const getUserRole = () => localStorage.getItem("userRole");

export const getUserName = () => localStorage.getItem("userName");

export const getUserEmail = () => localStorage.getItem("userEmail");
