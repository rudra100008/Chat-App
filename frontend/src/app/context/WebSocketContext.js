"use client"
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { Client, Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";


const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {

    const { token, userId } = useAuth();
    const [userLastSeen, setUserLastSeen] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const stompClientRef = useRef(null); // store client across renders

    const connectWebSocket = useCallback(() => {
        if (!token || !userId) return;
        const client = new Client({
            webSocketFactory: () => new SockJS(`${baseUrl}/server`),
            connectHeaders: {
                Authorization: `Bearer ${token}`
            },
            onConnect: () => {
                console.log("WebSocket connected in WebSocket ");
                client.subscribe('/topic/user-status', (message) => {
                    const userUpdate = JSON.parse(message.body);
                    if (userUpdate.userId === userId) {
                        setUserLastSeen(new Date(userUpdate.lastSeen).toISOString());
                        setUserStatus(userUpdate.status)
                    }
                })
            },

            onStompError: (frame) => {
                console.log("Error Details in webSocket: ", frame.body);
            }
        })
        stompClientRef.current = client;
        client.activate();
    }, [userId, token]);

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (stompClientRef.current && stompClientRef.current.active) {
                stompClientRef.current.deactivate().then(() => {
                    console.log("WebSocket disconnected");
                });
            }

        };
    }, [connectWebSocket]);

    const value = { userLastSeen, userStatus, stompClientRef };

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

