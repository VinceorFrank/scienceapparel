export const getToken = () => localStorage.getItem("token");

export const isLoggedIn = () => !!getToken();

export const isAdmin = () => {
  try {
    const token = getToken();
    if (!token) return false;

    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload));
    return decoded.isAdmin;
  } catch (err) {
    return false;
  }
};
