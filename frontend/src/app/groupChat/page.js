"use client"
import { useEffect, useReducer, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserChatsWithNames } from "../services/chatServices";
import { useRouter } from "next/navigation";
import GetUserImage from "../Component/GetUserImage";
import style from '../Style/group.module.css';
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";
import { useNotification } from "../context/NotificationContext";

const GroupChat = () => {
    const router = useRouter();
    const chatContainerRef = useRef(null);
    const inputContainerRef = useRef(null);
    const [chatInfos, setChatInfos] = useState([]);
    const [participantIds, setParticipantIds] = useState([]);
    const [selectedChat, setSelectedChat] = useState([]);
    const [chatNames, setChatNames] = useState({});
    const { userId,  isLoading, logout } = useAuth();
    const [chatName, setChatName] = useState('');
    const {success,error} = useNotification();

    const handleChatName = (e) => {
        setChatName(e.target.value)
    }
    const loadUserChat = async () => {
        try {
            const { chats, chatNames } = await fetchUserChatsWithNames(userId);

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
        if( !userId) return;

        try{
            const response = await  axiosInterceptor.post(`/api/chats/groupChat/${chatName}`,participantIds)
            console.log(response.data);
            success("Chat group created successful")
            router.push("/chat");
        }catch(error){
            console.log(error?.response.data);
        }
    }
   useEffect(() => {
    const handleClickOutside = (event) => {
       const isClickInChatContainer =  chatContainerRef.current.contains(event.target);
       const isClickInInputContainer = inputContainerRef.current.contains(event.target);
       if(!isClickInChatContainer && !isClickInInputContainer){
         console.log("Clicked outside both containers");
        setSelectedChat([]);
        setParticipantIds([]);
       }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
    useEffect(() => {
        if (isLoading) return;
        if (!userId) {
            logout();
        }
        loadUserChat();
    }, [userId])
    return (
        <div className={style.body}>
            <div  ref={inputContainerRef} className={style.inputGroup}>
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
            <div className={style.chatContainer} ref={chatContainerRef}>
                {chatInfos && chatInfos.map((chats) => (

                    chats.chatType === "SINGLE" ?
                    (
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
                    ): null
                ))}
            </div>
        </div>
    )
}

export default GroupChat;