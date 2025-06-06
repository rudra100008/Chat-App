"use client"
import { useEffect, useState } from "react"
import style from "../Style/userChats.module.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faEllipsisV, faGear, faSearch, faUser, faUserGroup } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import GetUserImage from "./GetUserImage";
import { useRouter } from "next/navigation";
import { fetchUserChatsWithNames } from "../services/chatServices";
import GetGroupImage from "./GetGroupImage";
import ChatInfoDisplay from "./ChatInfoDisplay";


export default function UserChats({ userId, token, onChatSelect, otherUserId, setShowSearchBox,setShowChatInfoBox,setSelectedChatInfo }) {
    const router = useRouter()
    const [chatInfo, setChatInfo] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [showbox, setShowBox] = useState(false);
    const [chatNames, setChatNames] = useState({});

    const loadUserChats = async () => {
        if (!userId || !token) return;

        try {
            const { chats, chatNames } = await fetchUserChatsWithNames(userId, token);
            setChatInfo(chats);
            setChatNames(chatNames);
        } catch (error) {
            if (error.response && error.response.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('userId');
                router.push("/");
            } else {
                console.log("ERROR from UserChats:", error.response?.message || error.message);
            }
        }
    };

    const getOtherUser = (chat) => {
        return chat.participantIds.filter(pIds => pIds !== userId)[0];
    }

    const handleChatClick = (chatId) => {
        console.log("handleChatClick", chatId)
        setSelectedChat(chatId);
        onChatSelect(chatId, chatNames[chatId] || "Unknown chat");
    }

    const handleEllipseVClick = () => {
        setShowBox((prevState) => !prevState);
    }

    const handleChatContainerClick = (chatDetails) => {
        setSelectedChatInfo(chatDetails);
        setShowChatInfoBox((prev)=> !prev);
    }
    const handleSearchClick = () => {
        setShowSearchBox(prev => !prev);
    }

    useEffect(() => {
        if (!userId || !token) {
            router.push("/")
        }
        loadUserChats();
    }, [userId, token])

    return (
        <div>
            <div className={style.Container}>
                <div className={style.Section}>
                    <FontAwesomeIcon icon={faSearch} className={style.searchButton} onClick={handleSearchClick} />
                    <div className={style.faEllipsisV} onClick={handleEllipseVClick}>
                        <FontAwesomeIcon icon={faEllipsisV} />
                    </div>
                    {showbox &&
                        <>
                            <div className={style.ShowBox}>
                                <Link href="/createChat">
                                   <div><FontAwesomeIcon icon={faUser} /></div>
                                    New Chat
                                </Link>
                                <Link href="/groupChat">
                                <div><FontAwesomeIcon icon={faUserGroup} /></div>
                                    New Group
                                </Link>
                                <Link href="/setting">
                                <div><FontAwesomeIcon icon={faGear} /></div>
                                    Setting
                                </Link>
                                <Link href="/profile">
                                <div><FontAwesomeIcon icon={faCircleUser} /></div>
                                    Profile
                                </Link>
                            </div>
                        </>
                    }
                </div>
                {chatInfo.length === 0 ? <p className={style.errorMessage}>No chats available</p> : (
                    <div>
                        {chatInfo.map((chat) => (
                            chat.chatType === "SINGLE" ?
                                (
                                    <div
                                        className={`${style.ChatContainer} ${selectedChat === chat.chatId ? style.active : ''}`}
                                        key={chat.chatId}
                                        onClick={() => handleChatClick(chat.chatId)}>
                                            <div onClick={(e)=>{
                                                e.stopPropagation();
                                                handleChatContainerClick(chat);
                                            }}> 
                                                 <GetUserImage userId={getOtherUser(chat)} />
                                            </div>
                                        <p className={style.chatName}>{chatNames[chat.chatId] || "Loading..."}</p>
                                    </div>
                                ) :
                                (
                                    <div className={`${style.ChatContainer} ${selectedChat === chat.chatId ? style.active : ''}`}
                                        key={chat.chatId}
                                        onClick={() => handleChatClick(chat.chatId)}
                                    >
                                        <GetGroupImage chatId={chat.chatId} />
                                        <p className={style.chatName}>{chatNames[chat.chatId] || "Loading..."}</p>
                                        <div className={style.faEllipseChatIcon} onClick={handleChatContainerClick}>
                                            <FontAwesomeIcon icon={faEllipsisV} />
                                        </div>
                                    </div>
                                )
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}