export const getToken = () => localStorage.getItem("token");

export const isLoggedIn = () => !!getToken();

export const isAdmin = () => localStorage.getItem("userRole") === "admin";

export const isCustomer = () => localStorage.getItem("userRole") === "customer";

export const getUserRole = () => localStorage.getItem("userRole");

export const getUserName = () => localStorage.getItem("userName");

export const getUserEmail = () => localStorage.getItem("userEmail");

export async function logout() {
  // 1) Clear tokens and any stored user info
  try { localStorage.removeItem('token'); } catch (_) {}
  try { localStorage.removeItem('userName'); } catch (_) {}
  try { localStorage.removeItem('userEmail'); } catch (_) {}
  try { localStorage.removeItem('userRole'); } catch (_) {}
  try { localStorage.removeItem('isAdmin'); } catch (_) {}

  // 2) Clear React Query cache (best-effort, via global reference)
  try {
    if (typeof window !== 'undefined' && window.__queryClient?.clear) {
      window.__queryClient.clear();
    }
  } catch (_) {}

  // 3) Tell the app things changed immediately
  try { window.dispatchEvent(new Event('authChanged')); } catch (_) {}
  try { window.dispatchEvent(new Event('cartUpdated')); } catch (_) {}

  return true;
}
