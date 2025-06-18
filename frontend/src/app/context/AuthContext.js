"use client"
import { useRouter } from "next/navigation";
import { createContext, useEffect, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userId, setUserId] = useState('');
    const [token, setToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');
            const storedToken = localStorage.getItem('token');

            if (storedUserId && storedToken) {
                setUserId(storedUserId);
                setToken(storedToken);
            }
        }
        setIsLoading(false);
        setIsInitialized(true);

    }, [])

    const login = (newUserId, newToken) => {
        localStorage.setItem("userId", newUserId);
        localStorage.setItem("token", newToken);
        setUserId(newUserId);
        setToken(newToken);
    }

    const logout = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        localStorage.removeItem("isTokenValid")
        setUserId('');
        setToken('');
        router.push('/')
    }
    const value = {
        token,
        userId,
        isLoading,
        isAuthenticated: !!token && !!userId,
        login,
        logout,
        isInitialized
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must used  within  an AuthProvider");
    }
    return context;
}
export default AuthContext;