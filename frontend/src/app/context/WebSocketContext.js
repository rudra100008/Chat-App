"use client"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { Client, Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";
import { useRouter } from "next/navigation";


const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
    const router = useRouter();
    const { token, userId } = useAuth();
    const [isWebSocketConnected,setIsWebSocketConnected] = useState(false);
    const [userLastSeen, setUserLastSeen] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const [chatInfo,setChatInfo] = useState([]);
    const stompClientRef = useRef(null); // store client across renders

    const connectWebSocket = useCallback(() => {
        if (!token || !userId) return;
        if(stompClientRef.current && stompClientRef.current.active){
            return;
        }
        const client = new Client({
            webSocketFactory: () => new SockJS(`${baseUrl}/server`),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                console.log("WebSocket connected in WebSocketProvider. ");
                setIsWebSocketConnected(true);
                client.subscribe('/topic/user-status', (message) => {
                    const userUpdate = JSON.parse(message.body);
                    if (userUpdate.userId === userId) {
                        setUserLastSeen(new Date(userUpdate.lastSeen).toISOString());
                        setUserStatus(userUpdate.status)
                    }
                })

                client.subscribe(`/user/${userId}/queue/chat-update`,(message)=>{
                    const payload = JSON.parse(message.body);
                    setChatInfo(prev=>(
                        prev.map(chat=>
                            chat.chatId === payload.chatId ? {...chat,...payload} : chat
                        )
                    ))
                })
            },

            onDisconnect: () => {
                console.log("WebSocket disconnected");
                setIsWebSocketConnected(false);
                router.refresh()
            },
            onStompError: (frame) => {
                console.log("Error Details in webSocket: ", frame.body);
               setIsWebSocketConnected(false);
               router.refresh();
            }
        })
        stompClientRef.current = client;
        client.activate();
    }, [userId, token]);


    const disconnectWebSocket = useCallback(() =>{
        if(stompClientRef.current && stompClientRef.current.active){
            stompClientRef.current.deactivate().then(()=>{
                console.log("WebSocket disconnected from WebSocket Provider.");
                setIsWebSocketConnected(false);
            })
        }
    },[])
    useEffect(() => {
        connectWebSocket();

        return () => {
            disconnectWebSocket();

        };
    }, [connectWebSocket,disconnectWebSocket]);

    const value = { userLastSeen, userStatus, stompClientRef,isWebSocketConnected,chatInfo,setChatInfo };

    return (
        <WebSocketContext.Provider value={value} >
            {children}
        </WebSocketContext.Provider>
    )
}

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (context === undefined) {
        throw new Error("useWebSocket must be used within WebSocketProvider.");
    }
    return context;
}
export default WebSocketContext;

