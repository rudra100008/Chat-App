"use client"
import { useEffect, useRef, useState } from 'react'
import style from '../Style/chat.module.css'
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import baseUrl from '../baseUrl';
import axiosInterceptor from '../Component/Interceptor';
import Message from '../Component/Message';
import { useRouter } from 'next/navigation';
import UserChats from '../Component/UserChats';

export default function Chat() {
    const route = useRouter();
    const [message, setMessage] = useState([])
    const [inputValue, setInputValue] = useState('');
    const [connected, setConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [error, setError] = useState(null);
    const [chatName,setChatName] = useState('chat')
    const messagesEndRef = useRef(null);
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
    const [userChat,setUserChat]= useState({
        chatId:"",
        chatName:"",
        chatType:"",
        participantIds:[],
        messageIds:[]
    })
    const chatId = '678cbc2c1f1b524403d7432a';

    const handleValueChange = (e) => {
        setInputValue(e.target.value)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'})
    }

    const fetchMessageFromChat = async () => {
        try {
            // Then fetch messages
            const response = await axiosInterceptor.get(`${baseUrl}/api/messages/chat/${chatId}?pageNumber=1`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log("Response from server:", response);
            const { data } = response.data;
            setMessage(data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
            if( error.response && error.response.status === 401){
                setError("Login again");
                setTimeout(()=>{
                    route.push("/");
                })
            }
            setError(error.response?.data?.message || error.message);
        }
    }


    const fetchUserChatDetails=async()=>{
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/chatDetails/${chatId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log("Data: ",response.data);
            const chatDetails = response.data
            setUserChat(chatDetails);
        }catch(error){
            console.log("Error: ",error.response?.data)
        }
    }    
    const handleSendMessage = () => {
        if (!inputValue.trim() || !connected) return;

        const messageDTO = {
            senderId: userId,
            chatId: chatId,
            content: inputValue.trim()
        }

        try {
            stompClient.send("/app/chat.sendMessage", 
                {
                    Authorization: `Bearer ${token}`
                }, 
                JSON.stringify(messageDTO)
            );
            setInputValue('');
        } catch (error) {
            console.error("Error sending message:", error);
            setError("Failed to send message");
        }
    }
    useEffect(() => {
        if (!userId || !chatId || !token) {
            setError("Missing required authentication information");
            return;
        }

        fetchMessageFromChat();
        
        const connectWebSocket = () => {
            const client = Stomp.over(() => new SockJS(`${baseUrl}/server`));
            
            const headers = {
                'Authorization': `Bearer ${token}`
            }

            client.connect(headers, () => {
                setConnected(true);
                setStompClient(client);
                client.subscribe(`/private/chat/${chatId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessage((prevMessages) => prevMessages.filter(msg=> msg.messageId !== receivedMessage.messageId)
                        .concat(receivedMessage)
                    );
                });
            }, (error) => {
                console.error('WebSocket connection error:', error);
                setConnected(false);
                setError("Failed to connect to chat server");
            });

            return client;
        }

        const client = connectWebSocket();

        return () => {
            if (client && client.connected) {
                client.disconnect();
            }
        }
    }, [userId, chatId, token]);

    useEffect(() => {
        scrollToBottom()
    }, [message])

    const getOtherUser = () => {
        if(!userChat.participantIds || userChat.participantIds.length === 0){
            console.log("No participants availble");
            return [];
        }
        const otherUser = userChat.participantIds.filter(pIds => pIds !== userId)[0];
        // console.log("Other users after filtering:", otherUser);
        return otherUser;
    }

    const fetchUserDetails=async()=>{
        // userChat.participantIds.forEach(pIds=>  console.log("Chat participants:",pIds))
        const otherUser = getOtherUser();
        console.log("OtherUsers: ",otherUser);
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${otherUser}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            setChatName(response.data.userName)
        }catch(error){
            console.log("Error: ",error.response.data)
        }
    }

    useEffect(()=>{
        if(!chatId || !token){
            setError("Missing required authentication information");
            return;
        }
        fetchUserChatDetails();
    },[chatId])

    useEffect(() => {
        if(userChat.chatId){
        fetchUserDetails();
        }
    }, [userChat]);

    if (error) {
        return <div className={style.error}>{error}</div>
    }

    return (
        <div className={style.body}>
            <div className={style.UserChat}>
                 {/* display chat  */}
                 <UserChats userId={userId} token={token} />
            </div>
            <div className={style.ChatContainer}>
                <div className={style.ChatHeader}>
                    <div className={style.ChatHeaderName}>
                        {
                            chatName
                        }
                    </div>
                </div>
                <Message message={message} userId={userId} />
                <div className={style.inputWrapper}>
                    <div className={style.FieldGroup}>
                        <input
                            type="text"
                            name='content'
                            id='content'
                            placeholder='Type a message'
                            className={style.FieldInput}
                            value={inputValue}
                            onChange={handleValueChange}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                    </div>
                    <div className={style.ButtonGroup}>
                        <button 
                            className={style.SendButton}
                            onClick={handleSendMessage}
                            disabled={!connected}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}