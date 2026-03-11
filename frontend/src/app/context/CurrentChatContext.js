'use client'
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { fetchChatDetailService } from "../services/chatServices";


const CurrentChatContext = createContext();


export const CurrentChatProvider = ({chatId,children}) =>{
    const [userChat,setUserChat] = useState({});

    const fetchCurrentChat = useCallback(async () => {
        if (!chatId) return;
        try {
            const data = await fetchChatDetailService(chatId);
            setUserChat(data);
        } catch(err) {
            console.error("Error in fetchCurrentChat: ", err.response?.data || err.message);
        }
    }, [chatId])

    useEffect(() => {
        fetchCurrentChat();
    }, [fetchCurrentChat]);

    const value = {
        userChat,
        setUserChat,
        fetchCurrentChat
    }

    return (
        <CurrentChatContext.Provider value={value}>
            {children}
        </CurrentChatContext.Provider>
    )
}

export const useCurrentChat = () =>{
    const context = useContext(CurrentChatContext);
    if(!context){
         throw new Error("useCurrentChatContext must be used inside CurrentChatProvider");
    }

    return context;
}