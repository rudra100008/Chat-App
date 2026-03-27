"use client"
import { useEffect, useMemo, useState } from "react"
import style from "../Style/userChats.module.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faEllipsisV, faGear, faSearch, faUser, faUserGroup, faTimes, faHashtag } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import GetUserImage from "./GetUserImage";
import GetGroupImage from "./GetGroupImage";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useChatDetailsContext } from "../context/ChatDetailContext";

// Format last message time
const formatLastMessageTime = (time) => {
    if (!time) return "";
    const date = new Date(time);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString("en-us", { month: "short", day: "numeric" });
};

export default function UserChats({ onChatSelect, chatNames, handleChatInfoToggle }) {
    const { userId } = useAuth();
    const { chatInfos, userStatusMap } = useWebSocket();
    const { chats: contextChats } = useChatDetailsContext();
    const [selectedChat, setSelectedChat] = useState(null);
    const [showbox, setShowBox] = useState(false);
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const displayChats = (chatInfos && chatInfos.length > 0) ? chatInfos : (contextChats || []);

    const getOtherUser = (chat) => chat.participantIds.filter(pId => pId !== userId)[0];

    const handleChatClick = (chatId) => {
        setSelectedChat(chatId);
        onChatSelect(chatId, chatNames[chatId] || "Unknown chat");
    };

    // Count online contacts
    const onlineCount = useMemo(() => {
        return displayChats.filter(chat => {
            if (chat.chatType !== "SINGLE") return false;
            const otherId = getOtherUser(chat);
            return userStatusMap[otherId]?.status === "ONLINE";
        }).length;
    }, [displayChats, userStatusMap]);

    const filteredChats = useMemo(() => {
        return (displayChats || []).filter((chat) => {
            if (activeTab === "groups" && chat.chatType !== "GROUP") return false;
            if (activeTab === "contacts" && chat.chatType !== "SINGLE") return false;
            if (searchQuery.trim()) {
                const name = (chatNames[chat.chatId] || "").toLowerCase();
                if (!name.includes(searchQuery.toLowerCase())) return false;
            }
            return true;
        });
    }, [displayChats, activeTab, searchQuery, chatNames]);

    return (
        <div className={style.Container}>
            {/* ── Header with title + actions ── */}
            <div className={style.sidebarHeader}>
                <div className={style.headerTop}>
                    <div className={style.titleBlock}>
                        <h2 className={style.sidebarTitle}>Messages</h2>
                        {onlineCount > 0 && (
                            <span className={style.onlinePill}>
                                <span className={style.onlinePillDot} />
                                {onlineCount} online
                            </span>
                        )}
                    </div>
                    <div className={style.headerActions}>
                        <div className={style.actionBtn} onClick={() => setShowBox(prev => !prev)} title="More options">
                            <FontAwesomeIcon icon={faEllipsisV} />
                        </div>
                        {showbox && (
                            <div className={style.ShowBox}>
                                <Link href="/createChat" className={style.showBoxItem}>
                                    <div className={style.showBoxIcon}><FontAwesomeIcon icon={faUser} /></div>
                                    <span>New Chat</span>
                                </Link>
                                <Link href="/groupChat" className={style.showBoxItem}>
                                    <div className={style.showBoxIcon}><FontAwesomeIcon icon={faUserGroup} /></div>
                                    <span>New Group</span>
                                </Link>
                                <div className={style.showBoxDivider} />
                                <Link href="/setting" className={style.showBoxItem}>
                                    <div className={style.showBoxIcon}><FontAwesomeIcon icon={faGear} /></div>
                                    <span>Settings</span>
                                </Link>
                                <Link href="/profile" className={style.showBoxItem}>
                                    <div className={style.showBoxIcon}><FontAwesomeIcon icon={faCircleUser} /></div>
                                    <span>Profile</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Search bar ── */}
                <div className={`${style.searchBarInner} ${isSearchFocused ? style.searchFocused : ""}`}>
                    <FontAwesomeIcon icon={faSearch} className={style.searchIcon} />
                    <input
                        className={style.searchBarInput}
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                    />
                    {searchQuery && (
                        <button className={style.clearSearch} onClick={() => setSearchQuery("")}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    )}
                </div>

                {/* ── Tab pills ── */}
                <div className={style.tabRow}>
                    {[
                        { key: "all", label: "All", count: displayChats.length },
                        { key: "contacts", label: "Direct", count: displayChats.filter(c => c.chatType === "SINGLE").length },
                        { key: "groups", label: "Groups", count: displayChats.filter(c => c.chatType === "GROUP").length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            className={`${style.tab} ${activeTab === tab.key ? style.activeTab : ""}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`${style.tabCount} ${activeTab === tab.key ? style.tabCountActive : ""}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Chat list ── */}
            <div className={style.chatList}>
                {filteredChats.length === 0 ? (
                    <div className={style.emptyState}>
                        <div className={style.emptyIcon}>
                            <FontAwesomeIcon icon={searchQuery ? faSearch : faHashtag} />
                        </div>
                        <p className={style.emptyTitle}>
                            {searchQuery ? "No results" : "No conversations"}
                        </p>
                        <p className={style.emptySubtitle}>
                            {searchQuery ? `Nothing matched "${searchQuery}"` : "Start a new chat to get going"}
                        </p>
                        {!searchQuery && (
                            <Link href="/createChat" className={style.emptyAction}>
                                New Chat
                            </Link>
                        )}
                    </div>
                ) : (
                    filteredChats.map((chat, index) => {
                        const otherUserId = getOtherUser(chat);
                        const userStatus = userStatusMap[otherUserId];
                        const isOnline = chat.chatType === "SINGLE" && userStatus?.status === "ONLINE";
                        const isActive = selectedChat === chat.chatId;

                        return (
                            <div
                                className={`${style.ChatItem} ${isActive ? style.active : ""}`}
                                key={chat.chatId}
                                onClick={() => handleChatClick(chat.chatId)}
                                style={{ animationDelay: `${index * 30}ms` }}
                            >
                                {/* Avatar */}
                                <div
                                    className={style.avatarWrap}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleChatInfoToggle(chat);
                                    }}
                                >
                                    {chat.chatType === "SINGLE" ? (
                                        <GetUserImage userId={otherUserId} size={46} />
                                    ) : (
                                        <GetGroupImage chatId={chat.chatId} chatType={chat.chatType} size={46} />
                                    )}
                                    {isOnline && <span className={style.onlineDot} />}
                                    {chat.chatType === "GROUP" && (
                                        <span className={style.groupBadge}>
                                            <FontAwesomeIcon icon={faUserGroup} />
                                        </span>
                                    )}
                                </div>

                                {/* Text content */}
                                <div className={style.chatContent}>
                                    <div className={style.chatTopRow}>
                                        <span className={style.chatName}>
                                            {chatNames[chat.chatId] || "Loading..."}
                                        </span>
                                        {chat.lastMessageTime && (
                                            <span className={style.timeStamp}>
                                                {formatLastMessageTime(chat.lastMessageTime)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={style.chatBottomRow}>
                                        <span className={style.lastMessage}>
                                            {chat.lastMessage
                                                ? chat.lastMessage.length <= 32
                                                    ? chat.lastMessage
                                                    : chat.lastMessage.slice(0, 32) + "…"
                                                : <span className={style.noMessage}>No messages yet</span>
                                            }
                                        </span>
                                        {isOnline && !isActive && (
                                            <span className={style.onlineIndicator} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}