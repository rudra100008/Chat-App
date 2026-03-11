"use client"
import { createContext, useState, useEffect, useContext } from "react";  // ← Consistent imports
import { fetchUserChatsService } from "../services/chatServices";
import { useAuth } from "./AuthContext";

const chatDetailContext = createContext();


export const ChatDetailProvider = ({ children }) => {
    // all chats of a user
    const [chats, setChats] = useState([]);
    const { userId, logout } = useAuth();
    
    const getChats =  async () => {
        if (!userId) return;
        try {
            const data = await fetchUserChatsService(userId, logout);
            console.log("ChatDetailContext - fetched chats: ", data)
            setChats(data);
        } catch(err) {
            console.error("Error in getChats: ", err.response?.data || err.message);
        }
    }

    useEffect(() => {
        getChats();
    }, [userId])

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
