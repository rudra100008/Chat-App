"use client"
import { useEffect, useMemo, useState } from "react"
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
import { useNotification } from "../context/NotificationContext";


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
    const { userId } = useAuth();
    const {error} = useNotification();
    const { chatInfos, userStatusMap } = useWebSocket();
    const [selectedChat, setSelectedChat] = useState(null);
    const [showbox, setShowBox] = useState(false);
     const [activeTab, setActiveTab] = useState("all"); // all | groups | contacts
    const [searchQuery, setSearchQuery] = useState("");


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
        if (!userId ) {
            error("login again");
            setTimeout(()=>{
                router.push('/')
            },1000)
        }
        loadUserChats();
    }, [userId])


    const filteredChats = useMemo(()=>{
        return (chatInfos || []).filter((chat) => {
    
        if (activeTab === "groups" && chat.chatType !== "GROUP") return false;
        if (activeTab === "contacts" && chat.chatType !== "SINGLE") return false;
        
        if (searchQuery.trim()) {
            const name = (chatNames[chat.chatId] || "").toLowerCase();
            if (!name.includes(searchQuery.toLowerCase())) return false;
        }
        return true;
    });
    },[chatInfos,activeTab,searchQuery,chatNames])

    if (isChatInfosLoading) {
        return (
            <div className={style.Container}>
                {/* Search bar */}
                <div className={style.searchBarRow}>
                    <div className={style.searchBarInner}>
                        <FontAwesomeIcon icon={faSearch} />
                        <input className={style.searchBarInput} placeholder="Search..." value="" disabled />
                    </div>
                </div>
                <p className={style.errorMessage}>Loading Chats...</p>
            </div>
        )
    }

    return (
        <div className={style.Container}>
            {/* ── Inline search bar ── */}
            <div className={style.searchBarRow}>
                <div className={style.searchBarInner}>
                    <FontAwesomeIcon icon={faSearch} />
                    <input
                        className={style.searchBarInput}
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* ── "Message" label ── */}
            <p className={style.sectionLabel}>Message</p>

            {/* ── Tab pills ── */}
            <div className={style.tabRow}>
                <button className={`${style.tab} ${activeTab === "all" ? style.activeTab : ""}`} onClick={() => setActiveTab("all")}>All Chats</button>
                <button className={`${style.tab} ${activeTab === "groups" ? style.activeTab : ""}`} onClick={() => setActiveTab("groups")}>Groups</button>
                <button className={`${style.tab} ${activeTab === "contacts" ? style.activeTab : ""}`} onClick={() => setActiveTab("contacts")}>Contacts</button>
            </div>

            {/* ── Ellipsis menu row ── */}
            <div className={style.Section}>
                <div className={style.faEllipsisV} onClick={handleEllipseVClick}>
                    <FontAwesomeIcon icon={faEllipsisV} />
                </div>
                {showbox && (
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
                )}
            </div>

            {/* ── Chat list ── */}
            {filteredChats.length === 0 ? (
                <p className={style.errorMessage}>
                    {searchQuery ? "No results found" : "No chats available"}
                </p>
            ) : (
                <div>
                    {filteredChats.map((chat) => {
                        const otherUserId = getOtherUser(chat);
                        const userStatus = userStatusMap[otherUserId];
                        const isOnline = userStatus?.status === 'ONLINE';

                        return (
                            <div
                                className={`${style.ChatContainer} ${selectedChat === chat.chatId ? style.active : ''}`}
                                key={chat.chatId}
                                onClick={() => handleChatClick(chat.chatId)}
                            >
                                {/* Avatar + online dot */}
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleChatInfoToggle(chat);
                                    }}
                                    className={`${style.imageContainer} ${chat.chatType === "SINGLE" && isOnline ? style.online : ''}`}
                                >
                                    {chat.chatType === "SINGLE" ? (
                                        <GetUserImage userId={otherUserId} />
                                    ) : (
                                        <GetGroupImage chatId={chat.chatId} chatType={chat.chatType} />
                                    )}
                                </div>

                                {/* Name + last message */}
                                <div className={style.chatTextBlock}>
                                    <p className={style.chatName}>{chatNames[chat.chatId] || "Loading..."}</p>
                                    {chat.lastMessage && (
                                        <p className={style.lastMessage}>
                                            {chat.lastMessage.length <= 35
                                                ? chat.lastMessage
                                                : chat.lastMessage.slice(0, 35) + "…"
                                            }
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}