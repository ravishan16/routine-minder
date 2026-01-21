import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  email: string;
  name: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Google Client ID - set this in your Google Cloud Console
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          prompt: () => void;
          renderButton: (
            element: HTMLElement,
            config: {
              theme?: string;
              size?: string;
              width?: number;
            }
          ) => void;
          revoke: (email: string, callback: () => void) => void;
        };
      };
    };
  }
}

function parseJwt(token: string): { email: string; name: string; picture: string } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleCredentialResponse = useCallback((response: { credential: string }) => {
    const userData = parseJwt(response.credential);
    if (userData) {
      const user: User = {
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
      };
      setUser(user);
      localStorage.setItem("routineMinder_user", JSON.stringify(user));
      localStorage.setItem("routineMinder_token", response.credential);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("routineMinder_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("routineMinder_user");
        localStorage.removeItem("routineMinder_token");
      }
    }

    // Load Google Identity Services
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google && GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: true,
        });
      }
      setIsLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [handleCredentialResponse]);

  const signIn = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.prompt();
    }
  }, []);

  const signOut = useCallback(() => {
    if (window.google && user) {
      window.google.accounts.id.revoke(user.email, () => {
        setUser(null);
        localStorage.removeItem("routineMinder_user");
        localStorage.removeItem("routineMinder_token");
      });
    } else {
      setUser(null);
      localStorage.removeItem("routineMinder_user");
      localStorage.removeItem("routineMinder_token");
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
