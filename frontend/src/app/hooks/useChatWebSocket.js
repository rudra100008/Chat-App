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
        if (!userId || !chatId) return;

        if (!isWebSocketConnected && stompClientRef.current && stompClientRef.current.active) {
            setError("WebSocket is not connected.");
            setConnected(false);
            return;
        }

        try {
            subscriptionRef.current = stompClientRef.current.subscribe(
                `/private/chat/${chatId}`,
                (message) => {
                    try {
                        const payload = JSON.parse(message.body);

                        // ── Tombstone from DELETE /api/messages/delete/{id} ──
                        // The controller sends { messageId, chatId, eventType: "DELETED" }
                        if (payload.eventType === "DELETED") {
                            setMessages(prev =>
                                prev.filter(m => m.messageId !== payload.messageId)
                            );
                            return;
                        }

                        // ── Normal message or edit update ──
                        // For edits, the server sends the full updated MessageDTO.
                        // We detect an edit by checking if the messageId already exists.
                        setMessages(prev => {
                            const existingIndex = prev.findIndex(
                                m => m.messageId === payload.messageId
                            );

                            if (existingIndex !== -1) {
                                // Replace existing message (edit or read-receipt update)
                                const updated = [...prev];
                                updated[existingIndex] = {
                                    ...updated[existingIndex],
                                    ...payload,
                                };
                                return updated;
                            }

                            // New message — append
                            return [...prev, payload];
                        });
                    } catch (err) {
                        console.error("Error processing WebSocket message:", err);
                    }
                },
                {
                    onError: (err) => {
                        console.error("Subscription error:", err);
                        setError("Subscription failed");
                    },
                }
            );

            setConnected(true);
            setError('');
        } catch (err) {
            console.error("Error subscribing to chat:", err);
            setError("Failed to subscribe to chat");
            setConnected(false);
        }
    }, [userId, chatId, setMessages, stompClientRef, isWebSocketConnected]);

    useEffect(() => {
        if (!chatId) {
            disconnectWebSocket();
            currentChatIdRef.current = null;
            return;
        }

        if (chatId !== currentChatIdRef.current) {
            disconnectWebSocket();
            currentChatIdRef.current = chatId;

            if (isWebSocketConnected && stompClientRef.current) {
                connectWebSocket();
            }
        }

        return () => {
            disconnectWebSocket();
        };
    }, [chatId, connectWebSocket, disconnectWebSocket, stompClientRef, isWebSocketConnected]);

    useEffect(() => {
        if (isWebSocketConnected && chatId && !connected && currentChatIdRef.current === chatId) {
            connectWebSocket();
        }
    }, [isWebSocketConnected, connectWebSocket, chatId, connected]);

    return {
        connected: isWebSocketConnected && !!subscriptionRef.current,
        stompClient: stompClientRef.current,
        error,
    };
};

export default useChatWebSocket;