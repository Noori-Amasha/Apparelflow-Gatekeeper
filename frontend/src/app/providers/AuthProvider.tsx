import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../../features/auth/api/auth.api";
import type { User } from "../../types/auth";

type AuthValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    sessionStorage.removeItem("apparelflow_token");
    setUser(null);
  };

  useEffect(() => {
    let active = true;
    const token = sessionStorage.getItem("apparelflow_token");

    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) {
          sessionStorage.removeItem("apparelflow_token");
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    sessionStorage.setItem("apparelflow_token", result.token);
    setUser(result.user);
    return result.user;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) throw new Error("AuthProvider is missing");

  return context;
}
