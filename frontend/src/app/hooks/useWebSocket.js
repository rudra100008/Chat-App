"use client"
import { Stomp } from "@stomp/stompjs";
import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";

const useWebSocket = ({ userId, chatId, token, messages, setMessages }) => {
    const [connected, setConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!userId || !chatId || !token) {
            if (!chatId) {
                return
            }
            setError("Missing required authentication information")
            return;
        }
        if (stompClient && stompClient.connected) {
            stompClient.disconnect();
            setStompClient(null);
            setConnected(false);
        }
        setMessages([]);

        const connectWebSocket = () => {
            const client = Stomp.over(() => new SockJS(`${baseUrl}/server`));
            const headers = { 'Authorization': `Bearer ${token}` }
            client.connect(headers, () => {
                setConnected(true);
                setStompClient(client);
                console.log(messages);
                console.log("ChatId in usewebsocket: \n", chatId)

                client.subscribe(`/private/chat/${chatId}`, (message) => {
                    console.log("Received message:", message.body); // More detailed logging
                    try {
                        const receivedMessage = JSON.parse(message.body);
                        console.log("Parsed message:", receivedMessage);

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
                console.error("WebSocket connection error:\n", error);
                setConnected(false);
                setError("Falied to connect to server")
            })
            return client;
        }
        const client = connectWebSocket();

        return () => {
            if (client && client.connected) {
                client.disconnect()
            }
        }
    }, [chatId, userId, token])
    return { connected, stompClient, error }
}

export default useWebSocket;