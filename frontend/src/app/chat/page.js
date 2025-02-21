"use client"
import { useEffect, useRef, useState } from 'react'
import style from '../Style/chat.module.css'
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import baseUrl from '../baseUrl';
import axiosInterceptor from '../Component/Interceptor';
import Message from '../Component/Message';

export default function Chat() {
    const [message, setMessage] = useState([])
    const [inputValue, setInputValue] = useState('');
    const [connected, setConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [error, setError] = useState(null);
    const messagesEndRef = useRef(null);
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
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
            const response = await axiosInterceptor.get(`${baseUrl}/api/messages/chat/${chatId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            console.log("Response from server:", response);
            const { data } = response.data;
            setMessage(data || []);
        } catch (error) {
            console.error("Error fetching messages:", error);
            setError(error.response?.data?.message || error.message);
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
            console.log("userId: ",userId);
            console.log("token: ",token)
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
                    setMessage((prevMessages) => [...prevMessages, receivedMessage]);
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

    if (error) {
        return <div className={style.error}>{error}</div>
    }

    return (
        <div className={style.body}>
            <div className={style.ChatContainer}>
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