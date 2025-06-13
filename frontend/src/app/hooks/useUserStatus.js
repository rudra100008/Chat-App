"use client"

import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import baseUrl from "../baseUrl";

const useUserStatus = ({ userId, token }) => {
    const [userLastSeen, setUserLastSeen] = useState(null);
    const [userStatus, setUserStatus] = useState(null);
    const stompClientRef = useRef(null); // store client across renders

    const connectWebSocket = useCallback(() => {
        if (!token || !userId) return;

        const socket = new SockJS(`${baseUrl}/server`);
        const stomp = Stomp.over(socket);
        stompClientRef.current = stomp;

        stomp.connect(
            { Authorization: `Bearer ${token}`, userId }, // headers for connect
            () => {
                console.log(" WebSocket connected");

                // Send ping for userActive
                stomp.send("/app/userActive", {}, {}); // no need for headers here unless custom logic

                // Subscribe to user-status topic
                stomp.subscribe("/topic/user-status", (message) => {
                    const userStatusPayload = JSON.parse(message.body);
                    if (userStatusPayload.userId === userId) {
                        setUserLastSeen(new Date(userStatusPayload.lastSeen).toISOString());
                        setUserStatus(userStatusPayload.status);
                    }
                });
            },
            (error) => {
                console.error(" WebSocket connection error:", error);
            }
        );
    }, [userId, token]);

    useEffect(() => {
        connectWebSocket();

        return () => {
            if (stompClientRef.current && stompClientRef.current.connected) {
                stompClientRef.current.disconnect(() => {
                    console.log(" WebSocket disconnected");
                });
            }
        };
    }, [connectWebSocket]);

    value = { userLastSeen, userStatus ,stompClientRef};
};

export default useUserStatus;
