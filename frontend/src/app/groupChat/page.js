"use client"
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserChatsWithNames } from "../services/chatServices";
import { useRouter } from "next/navigation";
import GetUserImage from "../Component/GetUserImage";
import style from '../Style/group.module.css';
const GroupChat = () => {
    const router = useRouter();
    const [chatInfos, setChatInfos] = useState([]);
    const [selectedChat,setSelectedChat] = useState('');
    const [chatNames, setChatNames] = useState({});
    const { userId, token,isLoading,logout } = useAuth();
    const loadUserChat = async () => {
        try {
            const { chats, chatNames } = await fetchUserChatsWithNames(userId, token);

            console.log("Chats in GroupChat:\n",chats);
            setChatInfos(chats);
            setChatNames(chatNames);
        } catch (error) {
            if(error.response && error.response.status === 403){
                console.log("Error from GroupChat:",error.response.message);
                logout();
            }else{
                console.log("Error from GroupChat:\n",error.response?.message);
            }
        }
    }

    const getOtherUser = (chats) => {
        return chats.participantIds.filter((id)=>id !== userId)[0];
    }

    const handleChatClick = (chatId) =>{
        setSelectedChat(chatId);
    }
    useEffect(()=>{
        if(isLoading) return;
        if(!userId || !token) {
            logout();
        }
        loadUserChat();
    },[userId,token])
    return (
        <div className={style.body}>
            <div className={style.chatContainer}>
            {chatInfos && chatInfos.map((chats)=>(
                <div 
                className={`${style.chatGroup} ${selectedChat === chats.chatId ? style.active : ''}`}
                key={chats.chatId} 
                onClick={()=>handleChatClick(chats.chatId)}>
                    <GetUserImage userId={getOtherUser(chats)} size={90} />
                    <p className={style.chatName}>{chatNames[chats.chatId]}</p>
                   
                </div>
            ))}
            </div>
        </div>
    )
}

export default GroupChat;