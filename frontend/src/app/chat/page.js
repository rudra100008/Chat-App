"use client"
import { useCallback, useEffect, useRef, useState } from 'react'
import style from '../Style/chat.module.css'
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import baseUrl from '../baseUrl';
import axiosInterceptor from '../Component/Interceptor';
import Message from '../Component/Message';
import { useRouter } from 'next/navigation';
import UserChats from '../Component/UserChats';

export default function Chat() {
    const route = useRouter();
    const [message, setMessage] = useState([]);
    const [page,setPage] = useState(0);
    const [totalPages,setTotalPages] = useState(null);
    const [initialLoad,setInitialLoad] = useState(true);
    const [hasMore,setHasMore] = useState(true);
    const [loading ,setLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [connected, setConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [error, setError] = useState(null);
    const [chatName,setChatName] = useState('chat')
    const messagesEndRef = useRef(null);
    const observer = useRef(IntersectionObserver | null);
    const [token, setToken] = useState(() => localStorage.getItem('token') || '');
    const [userId, setUserId] = useState(() => localStorage.getItem('userId') || '');
    const [userChat,setUserChat]= useState({
        chatId:"",
        chatName:"",
        chatType:"",
        participantIds:[],
        messageIds:[]
    })
    const [chatId,setChatId] =useState('');

    const handlleChatSelect=(selectedChat)=>{
        if(stompClient && stompClient.connected){
            stompClient.disconnect();
            setStompClient(null);
            setConnected(false);
        }
        setPage(0);
        setMessage([]);
        setInitialLoad(true);
        setHasMore(true);
        setChatId(selectedChat);
    }

    const handleValueChange = (e) => {
        setInputValue(e.target.value)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'})
    }

   // Initial fetch to get the latest messages
const initialFetch = async () => {
    setLoading(true);
    try {
      const response = await axiosInterceptor.get(`${baseUrl}/api/messages/chat/${chatId}?latest=true`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const { data, totalPage } = response.data;
      setMessage(data || []);
      setTotalPages(totalPage);
      
      // Start from the second-to-last page for next fetch (since we already have the last page)
      setPage(totalPage > 1 ? totalPage - 2 : 0);
      
      // If only one page exists, disable loading more
      if (totalPage <= 1) {
        setHasMore(false);
      }
      
      setInitialLoad(false);
    } catch (error) {
      console.error("Error fetching initial messages:", error);
      // Error handling
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch older messages as user scrolls up
  const fetchOlderMessages = async () => {
    setLoading(true);
    try {
      const response = await axiosInterceptor.get(`${baseUrl}/api/messages/chat/${chatId}?pageNumber=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const { data } = response.data;
      
      // Prepend older messages to the top of our message list
      setMessage(prev => [...data, ...prev]);
      
      // If we've reached page 0, there are no more messages to load
      if (page === 0) {
        setHasMore(false);
      } else {
        // Otherwise, decrease page number for next fetch
        setPage(prev => prev - 1);
      }
    } catch (error) {
      console.error("Error fetching older messages:", error);
      // Error handling
    } finally {
      setLoading(false);
    }
  };
  

  const firstMessageElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loading) {
            // No need to call setPage here, as it will trigger the effect above
            // Just set a flag to indicate we should fetch more
            if (page > 0) {
              setPage(prev => prev);  // This will re-trigger the useEffect without changing the value
            }
          }
        },
        { threshold: 0.5 }
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, page]
  );
    const fetchUserChatDetails=async()=>{
        if(!chatId && !token) return;
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/chatDetails/${chatId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log("Data: ",response.data);
            const chatDetails = response.data
            setUserChat(chatDetails);
        }catch(error){
            console.log("Error: ",error.response?.data)
        }
    }    
    const handleSendMessage = () => {
        if (!inputValue.trim() || !connected) return;

        const messageDTO = {
            senderId: userId,
            chatId: chatId,
            content: inputValue.trim()
        }

        try {
            stompClient.send("/app/chat.sendMessage", 
                {
                    Authorization: `Bearer ${token}`
                }, 
                JSON.stringify(messageDTO)
            );
            setInputValue('');
        } catch (error) {
            console.error("Error sending message:", error);
            setError("Failed to send message");
        }
    }
   

    useEffect(() => {
        if (!userId || !chatId || !token) {
            if(!chatId){
                return;
            }
            setError("Missing required authentication information");
            return;
        }
        setMessage([]);
        setInitialLoad(true);
        const connectWebSocket = () => {
            const client = Stomp.over(() => new SockJS(`${baseUrl}/server`));
            
            const headers = {
                'Authorization': `Bearer ${token}`
            }

            client.connect(headers, () => {
                setConnected(true);
                setStompClient(client);
                client.subscribe(`/private/chat/${chatId}`, (message) => {
                    const receivedMessage = JSON.parse(message.body);
                    setMessage((prevMessages) => prevMessages.filter(msg=> msg.messageId !== receivedMessage.messageId)
                        .concat(receivedMessage)
                    );
                });
            }, (error) => {
                console.error('WebSocket connection error:', error);
                setConnected(false);
                setError("Failed to connect to chat server");
            });

            return client;
        }

        const client = connectWebSocket();

        return () => {
            if (client && client.connected) {
                client.disconnect();
            }
        }
    }, [userId, chatId, token,page]);

    // useEffect(() => {
    //     if (chatId && initialLoad) {
    //         initialFetch();
    //     }
    // }, [chatId, initialLoad]);

      // In your useEffect
  useEffect(() => {
    if (chatId && initialLoad) {
      initialFetch();
    } else if (chatId && hasMore && !loading && page >= 0) {
      fetchOlderMessages();
    }
  }, [initialLoad, page,chatId]);

    useEffect(() => {
        scrollToBottom()
    }, [message])

    const getOtherUser = () => {
        if(!userChat.participantIds || userChat.participantIds.length === 0){
            console.log("No participants availble");
            return [];
        }
        const otherUser = userChat.participantIds.filter(pIds => pIds !== userId)[0];
        // console.log("Other users after filtering:", otherUser);
        return otherUser;
    }

    const fetchUserDetails=async()=>{
        // userChat.participantIds.forEach(pIds=>  console.log("Chat participants:",pIds))
        const otherUser = getOtherUser();
        console.log("OtherUsers: ",otherUser);
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${otherUser}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            setChatName(response.data.userName)
        }catch(error){
            console.log("Error: ",error.response.data)
        }
    }

    useEffect(()=>{
        if( !token || !userId){
            setError("Missing required authentication information");
            return;
        }
        if(!chatId) return;
        fetchUserChatDetails();
    },[token,userId,chatId])

    useEffect(() => {
        if(userChat.chatId){
        fetchUserDetails();
        }
    }, [userChat]);

    const logout=()=>{
        localStorage.clear();
        route.push("/")
    }
    if (error) {
        return <div className={style.error}>{error}</div>
    }

    return (
        <div className={style.body}>
            <div className={style.UserChat}>
                 {/* display chat  */}
                 <UserChats userId={userId} token={token} onChatSelect={handlleChatSelect} />
            </div>
            <div className={style.ChatContainer}>
                
                    
                <div className={style.ChatHeader}>
                    <div className={style.ChatHeaderName}>
                        {chatName}
                    </div>
                    <div className={style.logoutButton}>
                        <button onClick={logout}>Logout</button>
                    </div>
                </div>
                {chatId ? (
                    <>
                <Message message={message} userId={userId} lastPostElementRef ={firstMessageElementRef} />
                <div className={style.inputWrapper}>
                    <div className={style.FieldGroup}>
                        <input
                            type="text"
                            name='content'
                            id='content'
                            placeholder='Type a message'
                            className={style.FieldInput}
                            value={inputValue}
                            onChange={handleValueChange}
                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                    </div>
                    <div className={style.ButtonGroup}>
                        <button 
                            className={style.SendButton}
                            onClick={handleSendMessage}
                            disabled={!connected}
                        >
                            Send
                        </button>
                    </div>
                </div>
                </>
                ):(
                    <>
                     <div className={style.selectChatPrompt}>
                        Select a chat to start messaging
                     </div>
                    </>
                )}
            </div>
        </div>
    )
}