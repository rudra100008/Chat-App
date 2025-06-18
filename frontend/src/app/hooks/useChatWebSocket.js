"use client"
import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";
import { useWebSocket } from "../context/WebSocketContext";

const useChatWebSocket = ({ userId, chatId, token, messages, setMessages, router }) => {
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

    const handleTokenExpired = useCallback(() => {
        console.log("Token expired, logging out...");
        localStorage.clear();
        disconnectWebSocket();
        if (router && router.push) {
            router.push("/");
        } else {
            window.location.href = "/";
        }
    }, [router, disconnectWebSocket]);

    const connectWebSocket = useCallback(() => {
        if (!userId || !chatId || !token) {
            console.log("Missing params:", { userId, chatId, token: !!token });
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
                        const exists = prevMessages.some(msg =>
                            msg.messageId === receivedMessage.messageId
                        );

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
    }, [userId, token, chatId, setMessages, stompClientRef,]);

    useEffect(() => {
        if (!chatId) {
            disconnectWebSocket();
            currentChatIdRef.current = null;
            return;
        }

        if (chatId !== currentChatIdRef.current) {
            console.log("ChatId changed from", currentChatIdRef.current, "to", chatId);

            // Disconnect from previous chat
            disconnectWebSocket();

            // Update current chat reference
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