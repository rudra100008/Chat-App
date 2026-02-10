"use client"
import { useCallback, useEffect, useState } from 'react'
import style from '../Style/chat.module.css'
import baseUrl from '../baseUrl';
import axiosInterceptor from '../Component/Interceptor';
import { useRouter } from 'next/navigation';
import UserChats from '../Component/UserChats';
import ChatContainer from '../Component/chat/ChatContainer';
import { useAuth } from '../context/AuthContext';
import SearchUser from '../Component/SearchUser';
import ChatInfoDisplay from '../Component/ChatInfoDisplay';
import { useWebSocket } from '../context/WebSocketContext';
import { useChatManager } from '../hooks/useChatManager';
import PathGuard from '../Component/PathAuth/PathGuard';

export default function Chat() {
    const route = useRouter();
    const { userId, logout, isLoading, isInitialized } = useAuth()
    const [error, setError] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [otherUserDetails, setOtherUserDetails] = useState([]);
    const { userStatusMap, setUserStatusMap } = useWebSocket();
    const [userChat, setUserChat] = useState({
        chatId: "",
        chatName: "",
        chatType: "",
        participantIds: [],
    })

    const {
        chatId,
        chatName,
        chatNames,
        chatInfos,
        showSearchBox,
        showChatInfoBox,
        selectedChatInfo,
        isChatInfosLoading,

        setChatId,
        setChatName,
        setChatNames,
        setChatInfos,
        setShowSearchBox,
        setShowChatInfoBox,
        setSelectedChatInfo,
        setIsChatInfosLoading,

        loadUserChats,
        handleChatInfoToggle,
        handleSearchToggle,
        onChatSelect
    } = useChatManager();

    const otherUserId = () => {
        return selectedChatInfo.participantIds.find(pId => pId !== userId);
    }

    const fetchUserChatDetails = useCallback(async () => {
        if (!chatId) return;
        try {
            const response = await axiosInterceptor.get(`/api/chats/chatDetails/${chatId}`)
            setUserChat(response.data);
        } catch (error) {
            console.log("Error: ", error.response?.data)
        }
    }, [chatId])

    const getOtherUserId = () => {
        if (!userChat.participantIds || userChat.participantIds.length === 0) return [];
        if (userChat.chatType === 'GROUP') return null;
        return userChat.participantIds.filter(pIds => pIds !== userId)[0];
    }

    const fetchUserDetails = async () => {
        const otherUserIds = getOtherUserId();
        if (!otherUserIds) return
        try {
            const response = await axiosInterceptor.get(`/api/users/${otherUserIds}`, {})
            setOtherUserDetails(response.data);
        } catch (error) {
            console.log("Error in fetchUserDetails: ", error.response?.data);
            setOtherUserDetails([]);
        }
    }

    useEffect(() => {
        if (chatId) fetchUserChatDetails();
    }, [userId, chatId, isLoading, fetchUserChatDetails, route])

    useEffect(() => {
        if (userChat.chatId) fetchUserDetails();
    }, [userChat]);

    const handleErrorMessage = (message) => {
        setErrorMessage(message);
    }

    if (!isInitialized || isLoading) {
        return <div className={style.loading}>Loading authentication....</div>
    }
    if (error) {
        return <div className={style.error}>{error}</div>
    }

    return (
        <PathGuard>
        <div className={style.body}>
            {showSearchBox && <SearchUser onError={handleErrorMessage} />}
            {showChatInfoBox && selectedChatInfo &&
                <ChatInfoDisplay
                    lastSeen={userStatusMap[otherUserId()]?.lastSeen || null}
                    status={userStatusMap[otherUserId()]?.status || null}
                    userStatusMap={userStatusMap}
                    setUserStatusMap={setUserStatusMap}
                    userId={userId}
                    chatData={selectedChatInfo}
                    setChatData={setSelectedChatInfo}
                    loadUserChats={loadUserChats}
                    onClose={() => setShowChatInfoBox(false)}
                />
            }
            <div className={style.UserChat}>
                <UserChats
                    onChatSelect={onChatSelect}
                    setShowSearchBox={setShowSearchBox}
                    setShowChatInfoBox={setShowChatInfoBox}
                    setSelectedChatInfo={setSelectedChatInfo}
                    selectedChatInfo={selectedChatInfo}
                    chatId={chatId}
                    userStatusMap={userStatusMap}
                    loadUserChats={loadUserChats}
                    chatNames={chatNames}
                    setChatNames={setChatNames}
                    handleChatInfoToggle={handleChatInfoToggle}
                    handleSearchToggle={handleSearchToggle}
                    chatInfos={chatInfos}
                    isChatInfosLoading={isChatInfosLoading}
                />
            </div>
            <ChatContainer
                chatId={chatId}
                userId={userId}
                chatName={chatName}
                setOtherUserDetails={setOtherUserDetails}
                otherUserDetails={otherUserDetails}
                onLogout={logout}
            />
        </div>
        </PathGuard>
    )
}