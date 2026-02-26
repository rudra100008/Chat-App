"use client"
const { createContext, useState, useEffect, useContext } = require("react");
import { useChatDetails } from '@/app/hooks/useChatDetails';
const { fetchUserChatsService } = require("../services/chatServices");
const { useAuth } = require("./AuthContext");

const chatDetailContext = createContext();


export const ChatDetailProvider = ({children}) => {
    //all chats of a user
    const [chats,setChats] = useState([]);
    // a specific chat of user
    const [userchat,setUserChat] = useState({});
    const {userId,logout} = useAuth();
    const getChats = async() => {
        try{
            const data = await fetchUserChatsService(userId,logout);
            console.log("UserDetailsContext: ",data)
            setChats(data);
            
        }catch(err){
            console.log("Error in getChats in ChatDetailsContext: ",err.response.data);
        }
    }

    useEffect(()=>{
        if(!userId) return;
        getChats();
    },[userId])

    const value = {
        chats,
        setChats
    }
    return(
        <chatDetailContext.Provider value={value}>{children}</chatDetailContext.Provider>
    )
}

export const useChatDetailsContext = () =>{
    const context = useContext(chatDetailContext);
    if(context === 'undefined'){
        throw new Error("useChatDetailsContext must be used inside ChatDetailProvider");
    }
    return context;
}

export default chatDetailContext;
