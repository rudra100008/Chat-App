"use client";
import { useRouter } from "next/navigation";
import { createContext, useEffect, useState, useContext } from "react";
import { isTokenValidService, logoutService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const [tokenValidationList, setTokenValidationList] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId");

      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
    setIsLoading(false);
    setIsInitialized(true);
  }, []);

  const login = (newUserId) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("userId", newUserId);
    setUserId(newUserId);
  };

  const logout = async() => {
    if (typeof window !== "undefined") {
      try {
        const data = await logoutService();
        console.log(data.message);
        localStorage.removeItem("userId");
        setUserId("");
        router.push("/");
      } catch (err) {
        console.error("Error in logout(): ", err.response.data);
      }
    }
  };

  const isTokenValid = async () => {
    try {
      const data = await isTokenValidService();

      setTokenValidationList(data);
    } catch (err) {
      console.error("Error in isTokenValid: ", err.response?.data);
    }
  };
  const value = {
    userId,
    isLoading,
    isAuthenticated: !!userId,
    tokenValidationList,

    isTokenValid,
    login,
    logout,
    isInitialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must used  within  an AuthProvider");
  }
  return context;
};
export default AuthContext;
