
import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  fetchCurrentUser,
} from "../services/authService.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());

  const value = useMemo(
    () => ({
      user,

      async register(form) {
        return await registerUser(form);
      },

      async login(form) {
        const next = await loginUser(form);
        setUser(next);
        return next;
      },

      async refreshUser() {
        const next = await fetchCurrentUser();
        setUser(next);
        return next;
      },

      logout() {
        logoutUser();
        setUser(null);
      },
    }),
    [user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
