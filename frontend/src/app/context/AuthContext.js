"use client"
import { useRouter } from "next/navigation";
import { createContext,useEffect,useState,useContext } from "react";

const AuthContext = createContext();

 export const AuthProvider = ({children})=>{
    const [userId,setUserId] = useState('');
    const [token,setToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(()=>{
        const storedUserId = localStorage.getItem('userId');
        const storedToken =  localStorage.getItem('token');

         if (storedUserId && storedToken) {
            setUserId(storedUserId);
            setToken(storedToken);
        }
        setIsLoading(false);

    },[])

    const login =(newUserId,newToken)=>{
        localStorage.setItem("userId",newUserId);
        localStorage.setItem("token",newToken);
        setUserId(newUserId);
        setToken(newToken);
    }

    const logout  = () => {
        localStorage.removeItem("userId");
        localStorage.removeItem("token");
        setUserId('');
        setToken('');
        router.push('/')
    }
      const value = {
        token,
        userId,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
export const useAuth=()=>{
    const context = useContext(AuthContext);
    if(context === undefined){
        throw new Error("useAuth must used  within  an AuthProvider");
    }
    return context;
}
export default AuthContext;