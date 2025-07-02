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
    onChatSelect,
    setShowSearchBox,
    setShowChatInfoBox,
    selectedChatInfo,
    setSelectedChatInfo,
    loadUserChats,
    chatNames,
    handleChatInfoToggle,
    handleSearchToggle,
    isChatInfosLoading

}) {
    const router = useRouter();
    const { userId, token } = useAuth();
    const { chatInfos, userStatusMap } = useWebSocket();
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

    useEffect(() => {
        if (!userId || !token) {
            router.push("/")
        }
        loadUserChats();
    }, [userId, token])

    if (isChatInfosLoading) {
        return (
            <div className={style.Container}>
                <div className={style.Section}>
                    <FontAwesomeIcon icon={faSearch} className={style.searchButton} onClick={handleSearchToggle} />
                    <div className={style.faEllipsisV} onClick={handleEllipseVClick}>
                        <FontAwesomeIcon icon={faEllipsisV} />
                    </div>
                </div>
                <p className={style.errorMessage}>Loading Chats...</p>
            </div>
        )
    }
    return (
        <div>
            <div className={style.Container}>
                <div className={style.Section}>
                    <FontAwesomeIcon icon={faSearch} className={style.searchButton} onClick={handleSearchToggle} />
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
                {chatInfos.length === 0 ? <p className={style.errorMessage}>No chats available</p> : (
                    <div>
                        {chatInfos.map((chat) => {
                            const userStatus = userStatusMap[getOtherUser(chat)]
                            return (
                                chat.chatType === "SINGLE" ?
                                    (
                                        <div
                                            className={`${style.ChatContainer} ${selectedChat === chat.chatId ? style.active : ''}`}
                                            key={chat.chatId}
                                            onClick={() => handleChatClick(chat.chatId)}>
                                            <div onClick={(e) => {
                                                e.stopPropagation();
                                                handleChatInfoToggle(chat);
                                            }}>
                                                <div className={`${style.imageContainer} ${userStatus?.status === 'ONLINE' ? style.online : ""}`}>
                                                    <GetUserImage userId={getOtherUser(chat)} />
                                                </div>
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
                                                handleChatInfoToggle(chat);
                                            }}>
                                                <GetGroupImage chatId={chat.chatId} selectedChatInfo={selectedChatInfo} />
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
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}