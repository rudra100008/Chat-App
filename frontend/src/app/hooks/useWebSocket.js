"use client"
import { Client } from "@stomp/stompjs";
import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";

const useWebSocket = ({ userId, chatId, token, messages, setMessages,router }) => {
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState('');
    const currentChatIdRef = useRef(null);
    const subscriptionRef = useRef(null);
    const chatStompClientRef = useRef(null); // Separate ref for chat client

    const disconnectWebSocket = useCallback(() => {
        // Unsubscribe first
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
        }
        
        // Disconnect using modern Client
        if (chatStompClientRef.current && chatStompClientRef.current.active) {
            chatStompClientRef.current.deactivate(() => {
                chatStompClientRef.current = null;
                setConnected(false);
            });
        } else {
            setConnected(false);
        }
    }, []);

       const handleTokenExpired = useCallback(() => {
        console.log("Token expired, logging out...");
        // Clear token and user data
        localStorage.clear();
        // Disconnect websocket
        disconnectWebSocket();
        // Redirect to login
        if (router && router.push) {
            router.push("/");
        } else {
            // Fallback if router is not available
            window.location.href = "/";
        }
    }, [router, disconnectWebSocket]);

    const connectWebSocket = useCallback(() => {
        if (!userId || !chatId || !token) {
            console.log("Missing params:", { userId, chatId, token: !!token });
            return;
        }
        
        console.log("Connecting chat WebSocket for chatId:", chatId);
        
        const client = new Client({
            webSocketFactory: () => new SockJS(`${baseUrl}/server`),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
                userId: userId
            },
            onConnect: () => {
                console.log("Chat WebSocket connected for chat:", chatId);
                console.log("Current chatId ref:", currentChatIdRef.current);
                
                // Check if we're still connecting to the right chat
                if (currentChatIdRef.current !== chatId) {
                    console.log("Chat changed during connection, disconnecting");
                    client.deactivate();
                    return;
                }
                
                setConnected(true);
                chatStompClientRef.current = client;
                
                console.log("Chat client set and active:", client.active);
                
                subscriptionRef.current = client.subscribe(`/private/chat/${chatId}`, (message) => {
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
                });
                
                console.log("Subscribed to chat:", chatId);
            },
            onStompError: (frame) => {
                console.error("Chat STOMP Error for chatId:", chatId, frame);
                 const errorMessage = frame.headers?.message || '';
                
                // Check for various JWT expired patterns
                if (errorMessage.includes("JWT") && 
                    (errorMessage.includes("expired") || 
                     errorMessage.includes("Jwt expired") ||
                     errorMessage.includes("JWT expired"))) {
                    console.log("JWT token expired, handling logout...");
                    handleTokenExpired();
                    return;
                }
                
                // Check for other authentication errors
                if (errorMessage.includes("Unauthorized") || 
                    errorMessage.includes("Authentication") ||
                    errorMessage.includes("Invalid token")) {
                    console.log("Authentication error, handling logout...");
                    handleTokenExpired();
                    return;
                }
                setConnected(false);
                setError("Failed to connect to chat server");
            },
            onWebSocketError: (error) => {
                console.error("Chat WebSocket Error:", error);
                setConnected(false);
                setError("Chat WebSocket connection failed");
            }
        });
        
        client.activate();

    }, [userId, token, chatId, setMessages]);

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
            
            // Connect to new chat
            connectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [chatId, connectWebSocket, disconnectWebSocket]);

    return { 
        connected, 
        stompClient: chatStompClientRef.current, 
        error,
        chatStompClientRef // Return the ref for sending messages
    };
}

export default useWebSocket;