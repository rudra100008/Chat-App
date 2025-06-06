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
import ChatInfoDisplay from '../Component/ChatInfoDisplay';

export default function Chat() {
    const route = useRouter();
    const { token, userId, logout, isLoading } = useAuth()
    const [error, setError] = useState(null);
    const [chatName,setChatName] = useState('');
    const [errorMessage,setErrorMessage] = useState('');
    const [showSearchBox,setShowSearchBox] = useState(false);
    const [showChatInfoBox,setShowChatInfoBox] =  useState(false);
     const[selectedChatInfo,setSelectedChatInfo] = useState(null);
    const [otherUserDetails, setOtherUserDetails] = useState([])
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
            console.log("Data in /chat: ", response.data);
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
        console.log("Other user Id:\n",otherUserIds)
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
            {showChatInfoBox && <ChatInfoDisplay chatData={selectedChatInfo} onClose={()=> setShowChatInfoBox(false)}/>}
            <div className={style.UserChat}>
                {/* display chat  */}
                <UserChats
                    userId={userId}
                    otherUserId={ getOtherUserId }
                    token={token}
                    onChatSelect={handleChatSelect}
                    setShowSearchBox={setShowSearchBox}
                    setShowChatInfoBox ={setShowChatInfoBox}
                    setSelectedChatInfo={setSelectedChatInfo}
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