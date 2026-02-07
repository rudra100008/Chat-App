"use client"
import { useCallback, useEffect, useRef, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";

const useChatWebSocket = ({ userId, chatId, messages, setMessages, router }) => {
    const { stompClientRef, isWebSocketConnected } = useWebSocket();
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const currentChatIdRef = useRef(null);
    const subscriptionRef = useRef(null);

    const disconnectWebSocket = useCallback(() => {
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }
    }, []);



    const connectWebSocket = useCallback(() => {
        if (!userId || !chatId ) {
            console.log("Missing params:", { userId, chatId });
            return;
        }

        if(!isWebSocketConnected && stompClientRef.current && stompClientRef.current.active){
            console.log("WebSocket is not ready.")
            setError("WebSocket is  not connected.");
            setConnected(false);
            return;
        }

        try {
            console.log("Connecting chat WebSocket for chatId:", chatId);

            subscriptionRef.current = stompClientRef.current.subscribe(`/private/chat/${chatId}`, (message) => {
                console.log("=== CHAT MESSAGE RECEIVED ===");
                console.log("Raw message:", message);
                console.log("Message body:", message.body);
                console.log("================================");

                try {
                    const receivedMessage = JSON.parse(message.body);
                    console.log("Parsed message:", receivedMessage);

                    setMessages((prevMessages) => {
                        const index = prevMessages.findIndex(msg =>
                            msg.messageId === receivedMessage.messageId
                        );

                        if(index !== -1){
                            const updated = [...prevMessages];

                            updated[index] ={
                                ...updated[index],
                                ...receivedMessage,
                            }
                            return updated
                        }
                        return [...prevMessages,receivedMessage]
                    });
                } catch (error) {
                    console.error("Error processing received message:", error);
                }
            },
                {
                    onError: (error) => {
                        console.log("Subscription error:", error);
                        setError("Subscription failed")
                    }
                }
            );

            console.log("Subscribed to chat:", chatId);
            setConnected(true);
            setError('');
        } catch (error) {
            console.error("Error subscribing to chat:", error);
            setError("Failed to subscribe to chat");
            setConnected(false);
        }
    }, [userId, chatId, setMessages, stompClientRef,isWebSocketConnected]);

    useEffect(() => {
        if (!chatId) {
            disconnectWebSocket();
            currentChatIdRef.current = null;
            return;
        }

        if (chatId !== currentChatIdRef.current) {
            console.log("ChatId changed from", currentChatIdRef.current, "to", chatId);

            
            disconnectWebSocket();

            
            currentChatIdRef.current = chatId;

            if (isWebSocketConnected && stompClientRef.current) {
                connectWebSocket();
            }
        }

        return () => {
            disconnectWebSocket();
        };
    }, [chatId, connectWebSocket, disconnectWebSocket,stompClientRef,isWebSocketConnected]);

    useEffect(()=>{
        if(isWebSocketConnected && chatId && !connected && currentChatIdRef.current === chatId){
            connectWebSocket();
        }
    },[isWebSocketConnected,connectWebSocket,chatId,connected])
    return {
        connected: isWebSocketConnected && !!subscriptionRef.current,
        stompClient: stompClientRef.current,
        error,
    };
}

export default useChatWebSocket;