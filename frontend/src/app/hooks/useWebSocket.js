import { Stomp } from "@stomp/stompjs";
import { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";
import { headers } from "next/headers";

const useWebSocket = ({ userId, chatId, token }) => {
    const [connected, setConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState([]);

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

                client.subscribe(`private/chat/${chatId}`, (message) => {
                    const receivedMessage = JSON.parse(message);
                    setMessages((prevMessage) => prevMessage
                        .filter(msg => msg.messageId !== receivedMessage.messageId))
                        .concat(receivedMessage)
                })
            }, (error) => {
                    console.error("WebSocket connection error:\n", error);
                    setConnected(false);
                    setError("Falied to connect to server")
                })
                return client;
        }
        const client = connectWebSocket();

        return ()=>{
            if(client ,client.connected){
                client.disconnect
            }
        }
    }, [chatId, userId, token])
    return { connected, stompClient, error, messages, setMessages }
}

export default useWebSocket;