"use client"
import { createContext, useState, useEffect, useContext } from "react";  // ← Consistent imports
import { fetchUserChatsService } from "../services/chatServices";
import { useAuth } from "./AuthContext";
import { styles } from '@/app/Style/pathguard.module.css';

const chatDetailContext = createContext();


export const ChatDetailProvider = ({ children }) => {
    // all chats of a user
    const [chats, setChats] = useState([]);
    const { userId, logout,isAuthenticated,isLoading } = useAuth();
    
    const getChats =  async () => {
        if (!isAuthenticated || !userId){
            console.log("Not Authenticated, skipping getChats");
        }

        try {
            const data = await fetchUserChatsService(userId, logout);
            console.log("ChatDetailContext - fetched chats: ", data)
            setChats(data);
        } catch(err) {
            console.error("Error in getChats: ", err.response?.data || err.message);

            if(err.reponse?.status === 401 && err.response?.data?.error === 'token_expired'){
                console.log("Token expired during chat fetch,logging out");
                logout();
            }
        }
    }

    useEffect(() => {
        if(isAuthenticated && userId){
            getChats();
        }else{
            setChats([]);
        }
    }, [userId,isAuthenticated])

    const value = {
        chats,
        setChats
    }
    
    return (
        <chatDetailContext.Provider value={value}>
            {children}
        </chatDetailContext.Provider>
    )
}

export const useChatDetailsContext = () =>{
    const context = useContext(chatDetailContext);
    if(!context){
        throw new Error("useChatDetailsContext must be used inside ChatDetailProvider");
    }
    return context;
}

export default chatDetailContext;
