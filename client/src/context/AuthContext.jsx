
import {
  createContext,
  useContext,
  useEffect,
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
  const [authLoading, setAuthLoading] = useState(true);

  // Restore and verify the saved login session on app startup
  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const currentUser = await fetchCurrentUser();

        if (active) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error(
          "Session restoration failed:",
          error.message
        );
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      authLoading,

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
    [user, authLoading],
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
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
