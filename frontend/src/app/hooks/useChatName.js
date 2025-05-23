import { useEffect, useState } from "react";
import baseUrl from "../baseUrl";
import axiosInterceptor from "../Component/Interceptor";

const useChatName = ({userId,token,chatId}) => {
    const [chatName,setChatName] = useState('');
    const [userChatId,setUserChatId] = useState('');
    const fetchChatName = async () => {
        try{
            const response  = await axiosInterceptor.get(`${baseUrl}/api/chatName/fetchChatName/${userId}/chat/${chatId}`,{
                headers :{
                    Authorization : `Bearer ${token}`
                }
            })

            console.log("Chatname in useChatName:\n",response.data);
            setChatName(response.data.chatName);
            setUserChatId(response.data.chatId);
        }catch(error){
            console.log(error.response.data)
        }
    }
    useEffect(()=>{
        if(!userId || !token || !chatId) return

        fetchChatName();
    },[chatId,token,userId])
    return {chatName,userChatId};
}

export default useChatName;