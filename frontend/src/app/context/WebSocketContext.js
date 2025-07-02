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
    const [chatInfos,setChatInfos] = useState([]);
    const stompClientRef = useRef(null); 
    const [userStatusMap,setUserStatusMap] = useState({});

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

                    setUserStatusMap(prev=> ({
                        ...prev,
                        [userUpdate.userId]:{
                            status : userUpdate.status,
                            lastSeen : userUpdate.lastSeen
                        }
                    }))
                    if (userUpdate.userId === userId) {
                        setUserLastSeen(new Date(userUpdate.lastSeen).toISOString());
                        setUserStatus(userUpdate.status)
                    }
                })

                client.subscribe(`/user/${userId}/queue/chat-update`,(message)=>{
                    const payload = JSON.parse(message.body);
                    setChatInfos(prev=>(
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

    const value = { userLastSeen, userStatus, stompClientRef,isWebSocketConnected,chatInfos,setChatInfos,userStatusMap,setUserStatusMap };

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

