"use client"
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserChatsWithNames } from "../services/chatServices";
import { useRouter } from "next/navigation";

const GroupChat = () => {
    const router = useRouter();
    const [chatInfos, setChatInfos] = useState([]);
    const [chatNames, setChatNames] = useState({});
    const { userId, token } = useAuth();
    const loadUserChat = async () => {
        if (!userId || !token) return;
        try {
            const { chats, chatNames } =await fetchUserChatsWithNames(userId, token);
            setChatInfos(chats);
            setChatNames(chatNames);
        } catch (error) {
            if(error.response && error.response.status === 403){
                localStorage.removeItem("userId");
                localStorage.removeItem("token");
                console.log("Error from GroupChat:",error.response.message);
                router.push("/")
            }else{
                console.log("Error from GroupChat:\n",error.response?.message);
            }
        }
    }


    useEffect(()=>{
        if(!userId || !token) {
            router.push("/");
        }
        loadUserChat();
    },[userId,token])
    return (
        <div>
            hello
            {chatInfos && chatInfos.map((chats)=>(
                <div key={chats.chatId}>
                    <p>{chatNames[chats.chatId]}</p>
                </div>
            ))}
        </div>
    )
}

export default GroupChat;