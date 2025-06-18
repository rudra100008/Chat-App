"use client"
import { useCallback, useEffect, useState } from 'react'
import style from '../Style/chat.module.css'
import baseUrl from '../baseUrl';
import axiosInterceptor from '../Component/Interceptor';
import { useRouter } from 'next/navigation';
import UserChats from '../Component/UserChats';
import ChatContainer from '../Component/chat/ChatContainer';
import { useAuth } from '../context/AuthContext';
import ErrorPrompt from '../Component/ErrorPrompt';
import SearchUser from '../Component/SearchUser';
import ChatInfoDisplay from '../Component/ChatInfoDisplay';
import useUserStatus from '../hooks/useUserStatus';
import { useWebSocket } from '../context/WebSocketContext';

export default function Chat() {
    const route = useRouter();
    const { token, userId, logout, isLoading,isInitialized } = useAuth()
    const [error, setError] = useState(null);
    const [chatName, setChatName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [showChatInfoBox, setShowChatInfoBox] = useState(false);
    const [selectedChatInfo, setSelectedChatInfo] = useState(null);
    const [otherUserDetails, setOtherUserDetails] = useState([]);
    const [userStatusMap,setUserStatusMap] = useState({});
    const {stompClientRef} = useWebSocket();
    const [userChat, setUserChat] = useState({
        chatId: "",
        chatName: "",
        chatType: "",
        participantIds: [],
    })
    const [chatId, setChatId] = useState('');

    // from selectedChatInfo  which is set during when clicked in the image of the chat
    const otherUserId = () =>{
        return selectedChatInfo.participantIds.find(pId=> pId !== userId);
    }
    const checkOtherUserStatus = useCallback((otherId) => {
        if(!selectedChatInfo && !selectedChatInfo.participantIds) return;
        const stompClient = stompClientRef.current;
        if (stompClient && stompClient.connected) {
            return stompClient.subscribe('/topic/user-status', (message) => {
                const payload = JSON.parse(message.body);
                if (payload.userId === otherId) {
                   setUserStatusMap(prev=>({
                    ...prev,
                    [otherId]:{
                        status:payload.status,
                        lastSeen:payload.lastSeen
                    }
                   }))
                }
            })
        }
        return null;
    }, [selectedChatInfo, userId, stompClientRef])

    const handleChatSelect = (selectedChat, selectedChatName) => {
        setChatId(selectedChat);
        setChatName(selectedChatName);
    }
    const fetchUserChatDetails = async () => {
        if (!chatId && !token) return;
        try {
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/chatDetails/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            // console.log("Data in /chat: ", response.data);
            const chatDetails = response.data
            setUserChat(chatDetails);
        } catch (error) {
            console.log("Error: ", error.response?.data)
        }
    }

    const getOtherUserId = () => {
        if (!userChat.participantIds || userChat.participantIds.length === 0) {
            console.log("No participants availble");
            return [];
        }
        if (userChat.chatType === 'GROUP') {
            console.log("Chat is group type");
            return null;
        }
        const otherUser = userChat.participantIds.filter(pIds => pIds !== userId)[0];
        // console.log("Other users after filtering:", otherUser);
        return otherUser;
    }

    const fetchUserDetails = async () => {
        // userChat.participantIds.forEach(pIds=>  console.log("Chat participants:",pIds))
        const otherUserIds = getOtherUserId();
        console.log("Other user Id:\n", otherUserIds)
        if (!otherUserIds) return

        try {
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${otherUserIds}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log("OtherUser:\n", response.data)
            setOtherUserDetails(response.data);
        } catch (error) {
            console.log("Error in fetchUserDetails: ", error.response.data);
            setOtherUserDetails([]);
        }

    }

    useEffect(() => {
        if (isLoading) return;
        if (!token || !userId) {
            setError("Missing required authentication information");
            setTimeout(() => {
                route.push("/")
            }, 100)
            return;
        }

        if (chatId) {
            fetchUserChatDetails();
        }
    }, [token, userId, chatId, isLoading])

    useEffect(() => {
        if (userChat.chatId) {
            fetchUserDetails();
        }
    }, [userChat]);

    const closeErrorMessage = () => {
        setErrorMessage("");
    }
    const handleErrorMessage = (message) => {
        setErrorMessage(message);
    }

    if (!isInitialized || isLoading ) {
        return <div className={style.loading}>Loading authentication....</div>
    }
    if (error) {
        return <div className={style.error}>{error}</div>
    }

    return (
        <div className={style.body}>
            <ErrorPrompt errorMessage={errorMessage} onClose={closeErrorMessage} />
            {showSearchBox && <SearchUser onError={handleErrorMessage} />}
            {showChatInfoBox && selectedChatInfo &&
            <ChatInfoDisplay
                lastSeen ={userStatusMap[otherUserId()]?.lastSeen || null}
                status = {userStatusMap[otherUserId()]?.status || null}
                setUserStatusMap = {setUserStatusMap}
                userId={userId}
                checkOtherUserStatus={checkOtherUserStatus}
                chatData={selectedChatInfo}
                onClose={() => setShowChatInfoBox(false)} />}
            <div className={style.UserChat}>
                {/* display chat  */}
                <UserChats
                    userId={userId}
                    otherUserId={getOtherUserId}
                    token={token}
                    onChatSelect={handleChatSelect}
                    setShowSearchBox={setShowSearchBox}
                    setShowChatInfoBox={setShowChatInfoBox}
                    setSelectedChatInfo={setSelectedChatInfo}
                    selectedChatInfo ={selectedChatInfo}
                    chatId={chatId} />
            </div>
            <ChatContainer
                chatId={chatId}
                userId={userId}
                token={token}
                chatName={chatName}
                setOtherUserDetails={setOtherUserDetails}
                otherUserDetails={otherUserDetails}
                onLogout={logout} />
        </div>
    )
}