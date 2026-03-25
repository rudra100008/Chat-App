import { useCallback, useEffect, useState } from "react";
import axiosInterceptor from "../Component/Interceptor";

const useChatName = ({userId,chatId}) => {
    const [chatName,setChatName] = useState('');
    const [userChatId,setUserChatId] = useState('');
    const fetchChatName = useCallback( async () => {
        try{
            const response  = await axiosInterceptor.get(`/api/chatName/fetchChatName/${userId}/chat/${chatId}`)

            console.log("Chatname in useChatName:\n",response.data);
            setChatName(response.data.chatName);
            setUserChatId(response.data.chatId);
        }catch(error){
            console.log(error.response.data)
        }
    },[userId,chatId])
    useEffect(()=>{
        if(!userId  || !chatId) return

        fetchChatName();
    },[chatId,userId,fetchChatName])
    return {chatName,userChatId};
}

export default useChatName;