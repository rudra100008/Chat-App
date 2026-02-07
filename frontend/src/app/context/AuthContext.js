"use client"
import { useRouter } from "next/navigation";
import { createContext, useEffect, useState, useContext } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userId, setUserId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserId = localStorage.getItem('userId');

            if (storedUserId) {
                setUserId(storedUserId);
            }
        }
        setIsLoading(false);
        setIsInitialized(true);

    }, [])

    const login = (newUserId) => {
        localStorage.setItem("userId", newUserId);
        setUserId(newUserId);
    }

    const logout = () => {
        localStorage.removeItem("userId");
        setUserId('');
        router.push('/')
    }
    const value = {
        userId,
        isLoading,
        isAuthenticated:  !!userId,
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