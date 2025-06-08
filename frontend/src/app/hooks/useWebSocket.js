"use client"
import { Stomp } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";

const useWebSocket = ({ userId, chatId, token, messages, setMessages }) => {
    const [connected, setConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [error, setError] = useState('');
    const currentChatIdRef = useRef(null);

    const disconnectWebSocket = useCallback(()=>{
         if (stompClient && stompClient.connected) {
                stompClient.disconnect()
            }
        setStompClient(null);
        setConnected(false);
    },[])
    const connectWebSocket = useCallback(() => {
        if(!userId || !chatId || !token) return;
            const client = Stomp.over(() => new SockJS(`${baseUrl}/server`));
            const headers = { 'Authorization': `Bearer ${token}`,'userId':userId }
            client.connect(headers, () => {
                if (currentChatIdRef.current !== chatId) {
                client.disconnect();
                return;
            }
                setConnected(true);
                setStompClient(client);
                client.subscribe(`/private/chat/${chatId}`, (message) => {
                    console.log("Received message:", message.body); // More detailed logging
                    try {
                        const receivedMessage = JSON.parse(message.body);
                        setMessages((prevMessages) => {
                            // Check if message already exists
                            const exists = prevMessages.some(msg => msg.messageId === receivedMessage.messageId);
                            if (exists) {
                                console.log("Message already exists, not adding duplicate");
                                return prevMessages;
                            }
                            console.log("Adding new message to state");
                            return [...prevMessages, receivedMessage];
                        });
                    } catch (error) {
                        console.error("Error processing received message:", error);
                    }
                });

            }, (error) => {
               if (currentChatIdRef.current === chatId) {
                console.error("useWebSocket: Connection error for chatId:", chatId, error);
                setConnected(false);
                setError("Failed to connect to server");
            }
            })
            return client;
        },[userId,token,chatId,setMessages])

   useEffect(() => {
        if (!chatId) {
            disconnectWebSocket();
            currentChatIdRef.current = null;
            return;
        }

        if (chatId !== currentChatIdRef.current) {
            console.log("useWebSocket: ChatId changed from", currentChatIdRef.current, "to", chatId);
            
            // Disconnect from previous chat
            disconnectWebSocket();
            
            // Update current chat reference
            currentChatIdRef.current = chatId;
            
            // Connect to new chat
            connectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [chatId, connectWebSocket, disconnectWebSocket]);
    return { connected, stompClient, error }
}

export default useWebSocket;