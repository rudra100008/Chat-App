"use client"
import { useEffect, useState } from 'react'
import style from '../Style/chat.module.css'
import baseUrl from '../baseUrl';
import axiosInterceptor from '../Component/Interceptor';
import { useRouter } from 'next/navigation';
import UserChats from '../Component/UserChats';
import ChatContainer from '../Component/chat/ChatContainer';
import { useAuth } from '../context/AuthContext';
import ErrorPrompt from '../Component/ErrorPrompt';
import SearchUser from '../Component/SearchUser';

export default function Chat() {
    const route = useRouter();
    const { token, userId, logout, isLoading } = useAuth()
    const [error, setError] = useState(null);
    const [chatName,setChatName] = useState('');
    const [errorMessage,setErrorMessage] = useState('');
    const [showSearchBox,setShowSearchBox] = useState(false);

    const [otherUserDetails, setOtherUserDetails] = useState({
        profilePicture: "",
        status: '',
        userId: '',
        last_seen: '',
        email: '',
        userName: '',
        phoneNumber: '',
    })
    const [userChat, setUserChat] = useState({
        chatId: "",
        chatName: "",
        chatType: "",
        participantIds: [],
    })
    const [chatId, setChatId] = useState('');


    const handleChatSelect = (selectedChat,selectedChatName) => {
        setChatId(selectedChat);
        setChatName(selectedChatName);
    }
    const fetchUserChatDetails = async () => {
        if (!chatId && !token) return;
        try {
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/chatDetails/${chatId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log("Data: ", response.data);
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
            return [];
        }
        const otherUser = userChat.participantIds.filter(pIds => pIds !== userId)[0];
        // console.log("Other users after filtering:", otherUser);
        return otherUser;
    }

    const fetchUserDetails = async () => {
        // userChat.participantIds.forEach(pIds=>  console.log("Chat participants:",pIds))
        const otherUserId = getOtherUserId();
        if (!otherUserId) return

        try {
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${otherUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            console.log("OtherUser:\n", response.data)
            setOtherUserDetails(response.data);
        } catch (error) {
            console.log("Error: ", error.response.data)
        }
    }

    useEffect(() => {
        if(isLoading) return;
        if (!token || !userId) {
            setError("Missing required authentication information");
            setTimeout(() => {
                route.push("/")
            }, 100)
            return;
        }
        
        if(chatId){
            fetchUserChatDetails();
        }
    }, [token, userId, chatId,route,isLoading])

    useEffect(() => {
        if (userChat.chatId) {
            fetchUserDetails();
        }
    }, [userChat]);

    const closeErrorMessage=()=>{
        setErrorMessage("");
    }
     const handleErrorMessage=(message)=>{
        setErrorMessage(message);
    }

    if(isLoading){
        return <div className={style.loading}>Loading authentication....</div>
    }
    if (error) {
        return <div className={style.error}>{error}</div>
    }

    return (
        <div className={style.body}>
            <ErrorPrompt errorMessage={errorMessage} onClose={closeErrorMessage}/>
            {showSearchBox && <SearchUser onError={handleErrorMessage} />}
            <div className={style.UserChat}>
                {/* display chat  */}
                <UserChats
                    userId={userId}
                    otherUserId={otherUserDetails.userId}
                    token={token}
                    onChatSelect={handleChatSelect}
                    setShowSearchBox={setShowSearchBox}
                    chatId ={chatId} />
            </div>
            <ChatContainer
                chatId={chatId}
                userId={userId}
                token={token}
                chatName = {chatName}
                setOtherUserDetails={setOtherUserDetails}
                otherUserDetails={otherUserDetails}
                onLogout={logout} />
        </div>
    )
}