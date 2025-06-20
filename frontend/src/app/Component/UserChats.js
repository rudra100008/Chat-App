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
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";


export default function UserChats({
    userId,
    token,
    onChatSelect,
    otherUserId,
    setShowSearchBox,
    setShowChatInfoBox,
    selectedChatInfo,
    setSelectedChatInfo,
    loadUserChats,
    chatNames,
    setChatNames,
 }) {
    const router = useRouter();
    const { logout } = useAuth();
    const { chatInfo} = useWebSocket();
    const [selectedChat, setSelectedChat] = useState(null);
    const [showbox, setShowBox] = useState(false);


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
        console.log("handleChatContainerClicked in UserChats.js");
        console.log("ChatDetails from UserChats:\n",chatDetails)
        const isSame =  selectedChatInfo?.chatId === chatDetails.chatId;
        if(isSame){
            setSelectedChatInfo(null);
            setShowChatInfoBox(false);
        }else{
            setShowChatInfoBox(true);
            setSelectedChatInfo({
                ...chatDetails, chatName:chatNames[chatDetails.chatId]
            })
        }
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
                                        <div onClick={(e) => {
                                            e.stopPropagation();
                                            handleChatContainerClick(chat);
                                        }}>
                                            <GetUserImage userId={getOtherUser(chat)} />
                                        </div>
                                        <div>
                                            <p className={style.chatName}>{chatNames[chat.chatId] || "Loading..."}</p>
                                            {
                                                chat.lastMessage &&
                                                (<p className={style.lastMessage}>
                                                    {chat.lastMessage.length <= 20 ?
                                                        chat.lastMessage
                                                        : chat.lastMessage.slice(0, 20) + "...."
                                                    }
                                                </p>)
                                            }
                                        </div>
                                    </div>
                                ) :
                                (
                                    <div className={`${style.ChatContainer} ${selectedChat === chat.chatId ? style.active : ''}`}
                                        key={chat.chatId}
                                        onClick={() => handleChatClick(chat.chatId)}
                                    >
                                        <div onClick={(e) => {
                                            e.stopPropagation();
                                            handleChatContainerClick(chat);
                                        }}>
                                            <GetGroupImage chatId={chat.chatId} />
                                        </div>
                                        <div>
                                            <p className={style.chatName}>{chatNames[chat.chatId] || "Loading..."}</p>
                                            {
                                                chat.lastMessage &&
                                                (<p className={style.lastMessage}>
                                                    {chat.lastMessage.length < 50 ?
                                                        chat.lastMessage
                                                        : chat.lastMessage.slice(0, 50) + "...."
                                                    }
                                                </p>)
                                            }
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