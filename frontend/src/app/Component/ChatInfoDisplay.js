"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../Style/chatInfoDisplay.module.css"
import { faClose, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import { useWebSocket } from "../context/WebSocketContext";
import SingleChat from "./ChatInfoDisplay/SingleChat";
import GroupChat from "./ChatInfoDisplay/GroupChat";
import ShowGroupMembers from "./ChatInfoDisplay/ShowGroupMembers";


const ChatInfoDisplay = ({ userId, chatData, setChatData, onClose, lastSeen, status, userStatusMap, setUserStatusMap, loadUserChats }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [otherUserData, setOtherUserData] = useState({});
    const { stompClientRef } = useWebSocket();


    const otherUserId = (chat) => {
        return chat.participantIds.find(pId => pId !== userId);
    }

     const tabs = [
        { key: "overview", label: "OverView" },
        { key: "group",    label: "Group" },
        { key: "media",    label: "Media" },
    ];

     if (chatData.chatType === "GROUP") {
        tabs.push({ key: "members", label: "Members" });
    }

    const fetchOtherUser = async () => {
        const otherUserId = chatData.participantIds.find(pId => pId !== userId);
        try {
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${otherUserId}`)
            console.log(response.data);
            setUserStatusMap(prev => ({
                ...prev,
                [otherUserId]: {
                    lastSeen: response.data.lastSeen,
                    status: response.data.status
                }
            }))
            setOtherUserData(response.data);
        } catch (error) {
            const errorMessage = error?.response?.data;
            console.log(errorMessage);
        }
    }

    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return;
        const lastSeenDate = new Date(lastSeen);
        const today = new Date();

        const isSame = lastSeenDate.toDateString() === today.toDateString();

        if (isSame) {
            return lastSeenDate.toLocaleTimeString("en-us", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
            })
        } else {
            return lastSeenDate.toLocaleDateString("en-us", {
                day: "2-digit",
                month: "long",
                year: "numeric"
            })
        }
    }

    useEffect(() => {
        if (chatData.chatType !== "SINGLE") return;
        fetchOtherUser();
    }, [chatData, userId])


     return (
        <div className={style.chatInfoContainer}>
            {/* ── Left tab nav ── */}
            <div className={style.leftContainer}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={activeTab === tab.key ? style.activeTabBtn : ""}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Right content ── */}
            <div className={style.rightContainer}>
                <button className={style.closeButton} onClick={onClose} aria-label="Close">
                    <FontAwesomeIcon icon={faClose} size="lg" />
                </button>

                {activeTab === "overview" && (
                    <div>
                        {chatData.chatType === "SINGLE" ? (
                            <SingleChat
                                otherUserId={otherUserId}
                                otherUserData={otherUserData}
                                lastSeen={lastSeen}
                                status={status}
                                formatLastSeen={formatLastSeen}
                                chatData={chatData}
                                setChatData={setChatData}
                                loadUserChats={loadUserChats}
                            />
                        ) : (
                            <GroupChat
                                chatData={chatData}
                                setChatData={setChatData}
                                loadUserChats={loadUserChats}
                                onClose={onClose}
                            />
                        )}
                    </div>
                )}

                {activeTab === "group" && (
                    <div style={{ color: "#6b7a8d", textAlign: "center", marginTop: "2rem", fontSize: "0.9rem" }}>
                        Group Page
                    </div>
                )}

                {activeTab === "media" && (
                    <div style={{ color: "#6b7a8d", textAlign: "center", marginTop: "2rem", fontSize: "0.9rem" }}>
                        Media Page
                    </div>
                )}

                {chatData.chatType === "GROUP" && activeTab === "members" && (
                    <ShowGroupMembers
                        chatData={chatData}
                        setChatData={setChatData}
                        userStatusMap={userStatusMap}
                    />
                )}
            </div>
        </div>
    )
}
export default ChatInfoDisplay;