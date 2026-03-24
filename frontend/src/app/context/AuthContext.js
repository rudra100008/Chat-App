"use client";
import { useRouter } from "next/navigation";
import { createContext, useEffect, useState, useContext, useCallback } from "react";
import { isTokenValidService, logoutService } from "../services/authService";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const [tokenValidationList, setTokenValidationList] = useState({});

  useEffect(() => {
    const validateAuth = async () =>{
    if (typeof window !== "undefined") {
      const storedUserId = localStorage.getItem("userId");

      if (storedUserId) {
        try{
          const isValid = await isTokenValidService();
          if(isValid && isValid.isTokenValid){
            setUserId(storedUserId);
          }else{
            console.log("Token expired, clearing localStorage")
            localStorage.removeItem("userId");
          }
        }catch(err){
          console.log("Error in validating token",err);
          localStorage.removeItem("userId");
          localStorage.removeItem("token")
        }
      }
    }
      setIsLoading(false);
    setIsInitialized(true);
  }


  validateAuth();
  }, []);

  const login = (newUserId,token) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("userId", newUserId);
    localStorage.setItem("token",token);
    setUserId(newUserId);
  };

  const logout = async() => {
    if (typeof window !== "undefined") {
      try {
        await logoutService();
      } catch (err) {
        console.error("Error in logout(): ", err.response.data);
      }finally{
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        setUserId("");
        router.push("/");
      }
    }
  };

  const isTokenValid = useCallback( async () => {
    try {
      const data = await isTokenValidService();

      setTokenValidationList(data);
    } catch (err) {
      console.error("Error in isTokenValid: ", err.response?.data);
    }
  },[]);
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
