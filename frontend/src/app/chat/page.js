"use client"
import { useCallback, useEffect, useRef, useState } from 'react'
import style from '../Style/chat.module.css'
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import baseUrl from '../baseUrl';
import axiosInterceptor from '../Component/Interceptor';
import Message from '../Component/chat/Message';
import { useRouter } from 'next/navigation';
import UserChats from '../Component/UserChats';
import GetUserImage from '../Component/GetUserImage';
import ChatContainer from '../Component/chat/ChatContainer';

// const getToken=()=>{
//     localStorage.getItem('token');
// }
// const getUserId=()=>{
//     localStorage.getItem('userId');
// }
export default function Chat() {
    const route = useRouter();
    const [message, setMessage] = useState([]);
    const [page,setPage] = useState(0);
    const [totalPages,setTotalPages] = useState(null);
    const [initialLoad,setInitialLoad] = useState(true);
    const [hasMore,setHasMore] = useState(true);
    const [loading ,setLoading] = useState(true);
    const [value, setvalue] = useState('');
    const [connected, setConnected] = useState(false);
    const [stompClient, setStompClient] = useState(null);
    const [error, setError] = useState(null);
    const [chatName,setChatName] = useState('');
    const [otherUserDetails,setOtherUserDetails] = useState({
        profile_picture:"",
        status:'',
        userId:'',
        last_seen:'',
        email:'',
        userName:'',
        phoneNumber:'',
    })
    const messagesEndRef = useRef(null);
    const observer = useRef(null);
    const [token, setToken] = useState(() =>  localStorage.getItem('token') || '');
    const [userId, setUserId] = useState(() =>  localStorage.getItem('userId') || '');
    const [userChat,setUserChat]= useState({
        chatId:"",
        chatName:"",
        chatType:"",
        participantIds:[],
        messageIds:[]
    })
    const [chatId,setChatId] =useState('');


    const handleChatSelect=(selectedChat)=>{
        if(stompClient && stompClient.connected){
            stompClient.disconnect();
            setStompClient(null);
            setConnected(false);
        }
        setMessage([]);
        setPage(0);
        setTotalPages(null)
        setInitialLoad(true);
        setHasMore(true);
        setChatId(selectedChat);
    }


   

    const onChange = (e) => {
        setvalue(e.target.value)
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth'})
    }

   // Initial fetch to get the latest messages
const initialFetch = async () => {
    console.log("initialFetch")
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
      setPage(totalPage > 1 ? totalPage - 2 : -1);
      console.log("totalPage",totalPage)
      console.log("Page in initialFetch",page)
      
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
  const fetchOlderMessages = useCallback(async () => {
    console.log("fetchOlderMessages")
    if (loading || page < 0) return;
    
    setLoading(true);
    console.log("Fetching older messages for page:", page);
    console.log("initialLoad",initialLoad)
    
    try {
        const response = await axiosInterceptor.get(`${baseUrl}/api/messages/chat/${chatId}?pageNumber=${page}&latest=false`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        const { data ,totalPage} = response.data;
        
        
        if (data && page >=0) {
            // Prepend older messages to the top of our message list
            setMessage(prev => [...data, ...prev]);
            
            // Decrease page number for next fetch
            setPage(prev => prev - 1);
        } 
        if(page < 0)  {
            // No more messages to load
            setHasMore(false);
        }
    } catch (error) {
        console.error("Error fetching older messages:", error);
        // Error handling
    } finally {
        setLoading(false);
    }
},[loading, page, chatId, token, setMessage, setPage, setHasMore, setLoading]);
  

const firstMessageElementRef = useCallback(
    (node) => {
      // Don't do anything if we're loading
      if (loading) return;
      
      // Disconnect any existing observer before creating a new one
      if (observer.current) observer.current.disconnect();
      
      // Create a new observer only on the client side
      if (typeof window !== 'undefined') {
        observer.current = new IntersectionObserver(
          (entries) => {
            // When the element is visible and we have more data to load
            if (entries[0].isIntersecting && hasMore && !loading && page >= 0) {
              fetchOlderMessages();
            }
          },
          { threshold: 0.5 } // This determines how much of the element needs to be visible
        );
        
        // Observe the node if it exists
        if (node) observer.current.observe(node);
      }
    },
    [loading, hasMore, page, fetchOlderMessages]
  );

  useEffect(()=>{
    return ()=>{
        if(observer.current){
            observer.current.disconnect();
        }
    }
  },[])
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
    const onSend = () => {
        if (!value.trim() || !connected) return;

        const messageDTO = {
            senderId: userId,
            chatId: chatId,
            content: value.trim()
        }

        try {
            stompClient.send("/app/chat.sendMessage", 
                {
                    Authorization: `Bearer ${token}`
                }, 
                JSON.stringify(messageDTO)
            );
            setvalue('');
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
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setTimeout(()=>{
                route.push("/")
            },100)
            return;
        }
        setMessage([]);
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
    }, [userId, chatId, token]);

    // useEffect(() => {
    //     if (chatId && initialLoad) {
    //         initialFetch();
    //     }
    // }, [chatId, initialLoad]);

      // In your useEffect
      useEffect(() => {
        if (chatId && initialLoad) {
          initialFetch();
        }
      }, [chatId, initialLoad]);
      
      useEffect(() => {
        if (chatId && !initialLoad && hasMore && !loading && page >= 0) {
          fetchOlderMessages();
        }
      }, [chatId, initialLoad, page, hasMore, loading, fetchOlderMessages]);
      

    useEffect(() => {
        scrollToBottom()
    }, [message])

    const getOtherUserId = () => {
        if(!userChat.participantIds || userChat.participantIds.length === 0){
            console.log("No participants availble");
            return [];
        }
        if(!userChat.chatType === 'GROUP'){
            console.log("Chat is group type");
            return [];
        }
        const otherUser = userChat.participantIds.filter(pIds => pIds !== userId)[0];
        // console.log("Other users after filtering:", otherUser);
        return otherUser;
    }

    const fetchUserDetails=async()=>{
        // userChat.participantIds.forEach(pIds=>  console.log("Chat participants:",pIds))
        const otherUserId = getOtherUserId();
        if (!otherUserId) return
       
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${otherUserId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log("OtherUser:\n",response.data)
            setOtherUserDetails(response.data);
        }catch(error){
            console.log("Error: ",error.response.data)
        }
    }

    useEffect(()=>{
        if( !token || !userId){
            setError("Missing required authentication information");
            localStorage.removeItem('token');
            localStorage.removeItem('userId');
            setTimeout(()=>{
                route.push("/")
            },100)
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

    const  onLogout=()=>{
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
                 <UserChats 
                 userId={userId} 
                 otherUserId={otherUserDetails.userId} 
                 token={token} 
                 onChatSelect={handleChatSelect} />
            </div>
           <ChatContainer 
           chatId={chatId}
           userId={userId}
           token={token}
           setOtherUserDetails={setOtherUserDetails}
           otherUserDetails={otherUserDetails}
           onLogout={onLogout} />
        </div>
    )
}