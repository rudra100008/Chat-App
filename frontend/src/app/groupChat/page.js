"use client"
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserChatsWithNames } from "../services/chatServices";
import { useRouter } from "next/navigation";
import GetUserImage from "../Component/GetUserImage";
import style from '../Style/group.module.css';
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";

const GroupChat = () => {
    const router = useRouter();
    const chatContainerRef = useRef(null);
    const [chatInfos, setChatInfos] = useState([]);
    const [participantIds, setParticipantIds] = useState([]);
    const [selectedChat, setSelectedChat] = useState([]);
    const [chatNames, setChatNames] = useState({});
    const { userId, token, isLoading, logout } = useAuth();
    const [chatName, setChatName] = useState('');

    const handleChatName = (e) => {
        setChatName(e.target.value)
    }
    const loadUserChat = async () => {
        try {
            const { chats, chatNames } = await fetchUserChatsWithNames(userId, token);

            console.log("Chats in GroupChat:\n", chats);
            setChatInfos(chats);
            setChatNames(chatNames);
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log("Error from GroupChat:", error.response.message);
                logout();
            } else {
                console.log("Error from GroupChat:\n", error.response?.message);
            }
        }
    }

    const getOtherUser = (chats) => {
        return chats.participantIds.filter((id) => id !== userId)[0];
    }

    const handleChatClick = (chats) => {
        const getParticipantIds = getOtherUser(chats);
        setSelectedChat(prev =>
            prev.includes(chats.chatId)
                ? prev.filter(id => id !== chats.chatId)
                : [...prev, chats.chatId]
        );
        setParticipantIds(prev =>
            prev.includes(getParticipantIds)
                ? prev.filter(id => id !== getParticipantIds)
                : [...prev, getParticipantIds]
        )
    }

    const setGroupChat = async () => {
        if(!token || !userId) return;

        try{
            const response = await  axiosInterceptor.post(`${baseUrl}/api/chats/groupChat/${chatName}`,participantIds,{
                headers:{Authorization: `Bearer ${token}`}
            })
            console.log(response.data);
        }catch(error){
            console.log(error?.response.message);
        }
    }
    useEffect(() => {
        const handleClickOutside = (event) => {

            if (!event.target.closest(`.${style.chatGroup}`)) {
                setSelectedChat([]);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    useEffect(() => {
        if (isLoading) return;
        if (!userId || !token) {
            logout();
        }
        loadUserChat();
    }, [userId, token])
    return (
        <div className={style.body}>
            <div className={style.inputGroup}>
                <input 
                id="chatName"
                name="chatname"
                type="text"
                placeholder="Enter chatName...."
                value={chatName}
                onChange={handleChatName}
                className={style.input}
                />
                <div className={style.ButtonGroup}>
                    <button type="submit" onClick={setGroupChat}>Submit</button>
                </div>
            </div>
            {participantIds}
            <div className={style.chatContainer} ref={chatContainerRef}>
                {chatInfos && chatInfos.map((chats) => (
                    <div
                        className={`${style.chatGroup} ${selectedChat.includes(chats.chatId) ? style.active : ''}`}
                        key={chats.chatId}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleChatClick(chats)
                        }}>
                        <GetUserImage userId={getOtherUser(chats)} size={60} />
                        <p className={style.chatName}>{chatNames[chats.chatId]}</p>

                    </div>
                ))}
            </div>
        </div>
    )
}

export default GroupChat;