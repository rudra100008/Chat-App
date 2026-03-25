"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { Client, } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import baseUrl from "../baseUrl";
import { fetchUserChatsWithNames } from "../services/chatServices";

const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const { userId } = useAuth();
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [userLastSeen, setUserLastSeen] = useState(null);
  const [userStatus, setUserStatus] = useState(null);
  const [chatInfos, setChatInfos] = useState([]);
  const [chatNames, setChatNames] = useState({});
  const stompClientRef = useRef(null);
  const [userStatusMap, setUserStatusMap] = useState({});
  const reconnectTimeoutRef = useRef(null);

  const connectWebSocket = useCallback(() => {
    if(typeof window === 'undefined') return
    const token = localStorage.getItem("token");
    if (!userId){
      console.log("No userId,skipping Websocket connection");
      return;
    }

    if(stompClientRef.current){
      stompClientRef.current.deactivate();
    }
    if(reconnectTimeoutRef.current){
      clearTimeout(reconnectTimeoutRef.current);
    }



    // Convert HTTP(S) baseUrl to WS(S) for the brokerURL
    const wsBaseUrl = baseUrl.replace(/^http/, 'ws');
    
    const client = new Client({
        brokerURL: `${wsBaseUrl}/server?token=${token}`,
        connectHeaders: {
          Authorization : `Bearer ${token}`
        },
        reconnectDelay:5000, // 5 sec to automatically try to reconnect
        heartbeatIncoming:4000, // client excepts to receive a hearbeat from the server every 4 sec
        heartbeatOutgoing:4000, // client send a heartbeat to server every 4 secs


      onConnect: () => {
        console.log("WebSocket connected successfully ");
        setIsWebSocketConnected(true);

        // Load initial chats when connected
        const loadInitialChats = async () => {
          try {
            const { chats, chatNames: loadedChatNames } = await fetchUserChatsWithNames(userId);
            setChatInfos(chats);
            setChatNames(loadedChatNames);
          } catch (err) {
            console.error("Error loading initial chats on WebSocket connect:", err);
          }
        };
        loadInitialChats();

        client.subscribe("/topic/user-status", (message) => {
          try{
               const userUpdate = JSON.parse(message.body);

          setUserStatusMap((prev) => ({
            ...prev,
            [userUpdate.userId]: {
              status: userUpdate.status,
              lastSeen: userUpdate.lastSeen,
            },
          }));
          if (userUpdate.userId === userId) {
            setUserLastSeen(new Date(userUpdate.lastSeen).toISOString());
            setUserStatus(userUpdate.status);
          }
          }catch(err){
            console.error("Error parsing user-status message: ",err);
          }
          
       
        });

        client.subscribe(`/user/${userId}/queue/chat-update`, (message) => {
          try{
             const payload = JSON.parse(message.body);
          setChatInfos((prev) =>
            prev.map((chat) =>
              chat.chatId === payload.chatId ? { ...chat, ...payload } : chat
            )
          );
          }catch(err){
            console.error("Error parsing chat-update message: ",err);
          }

        });

        client.subscribe(`/user/${userId}/queue/chats`, (message) => {
          try{
             const payload = JSON.parse(message.body);
          if (payload.type === "NEW_CHAT") {
            const newChat = payload.chat;
            console.log("New chat received:", newChat.chatName, newChat.chatId);
            
            setChatInfos((prev) => {
              const exists = prev?.some(chat=> chat.chatId === newChat.chatId);
              return exists ? prev : [...prev, newChat];
            });
            
            // Immediately store the chat name from the payload
            if (newChat.chatName) {
              setChatNames((prev) => ({
                ...prev,
                [newChat.chatId]: newChat.chatName
              }));
            }
          }
          }catch(err){
            console.error("Error parsing chat message",err);
          }
         
        });
      },

      onDisconnect: () => {
        console.log("WebSocket disconnected");
        setIsWebSocketConnected(false);
      },
      onWebSocketError: (error)=>{
        console.error("WebSocket error: ",error)
        setIsWebSocketConnected(false)
      },
      onStompError: (frame) => {
        console.log("Stomp Error: ", frame.headers['message'] || frame.body);
        setIsWebSocketConnected(false);
      },
    });
    stompClientRef.current = client;
    client.activate();

    return client;
  }, [userId]);

  const disconnectWebSocket = useCallback(() => {
    if (stompClientRef.current && stompClientRef.current.active) {
      stompClientRef.current.deactivate().then(() => {
        console.log("WebSocket disconnected from WebSocket Provider.");
        setIsWebSocketConnected(false);
      });
    }
  }, []);

  useEffect(() => {
    connectWebSocket();

    return () => {
      disconnectWebSocket();
    };
  }, [connectWebSocket, disconnectWebSocket]);

  useEffect(()=>{
    const handleVisiblityChange = () =>{
      if(document.visibilityState === 'visible' && !isWebSocketConnected && userId){
        connectWebSocket();
      }
    }

    document.addEventListener("visibilitychange",handleVisiblityChange)

    return ()=>{
      document.removeEventListener("visibilitychange",handleVisiblityChange)
    }
  },[connectWebSocket,isWebSocketConnected,userId])

  const value = {
    userLastSeen,
    userStatus,
    stompClientRef,
    isWebSocketConnected,
    chatInfos,
    setChatInfos,
    chatNames,
    setChatNames,
    userStatusMap,
    setUserStatusMap,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useWebSocket must be used within WebSocketProvider.");
  }
  return context;
};
export default WebSocketContext;
