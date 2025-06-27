"use client"
import { useEffect, useReducer, useRef, useState } from 'react'
import style from '../../Style/chat.module.css'
import SingleChatMessage from './SingleChatMessage';
import GroupChatMessage from './GroupChatMessage';
import axiosInterceptor from '../Interceptor';
import baseUrl from '@/app/baseUrl';

export default function Message({ message, userId , loading,firstPostElementRef,userChat,token}) {
    const messageEndRef = useRef(null);
    const containerRef = useRef(null);
    const prevScrollHeight = useRef(0);
    const [userName,setUsername] = useState([]);
    // const [loading,setLoading] = useState(true);
    const scrollToBottom=()=>{
        messageEndRef.current?.scrollIntoView({behavior : "smooth"})
    }
   
    const maintainScrollHeight = () => {
        if(containerRef.current){
            const container = containerRef.current;
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - prevScrollHeight.current;
            container.scrollTop = container.scrollTop + scrollDiff;
            prevScrollHeight.current = newScrollHeight;
        }
    }

    const fetchUser = async(userId) => {
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${userId}`,{
                headers:{
                    Authorization: `Bearer ${token}`
                }
            })
            const userData = response.data;
            console.log("Message: UserData:\n",userData);
            return userData;
        }catch(error){
            console.log("Message: error:\n",error.response.data.message)
        }finally{
            
        }
    }
    useEffect(()=>{
        if(containerRef.current && !loading){
            prevScrollHeight.current = containerRef.current.scrollHeight;
        }
    },[message.length])

    useEffect(()=>{
        if(loading){
            maintainScrollHeight();
        }else{
            if(containerRef.current){
                const container  = containerRef.current;
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if(isNearBottom){
                    scrollToBottom();
                }
            }
        }
    },[message,loading])
    // Format timestamp function to avoid repetition
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleDateString();
    };

    useEffect(() => {
        scrollToBottom()
    }, [message]);
    
    // console.log("Message.js: UserChat:\n",userChat);
    return (
        <div ref={containerRef} className={style.MessageContainer}>
             {loading && (
                <div className={style.LoadingIndicator}>Loading older messages...</div>
            )}
            {
                userChat.chatType === "SINGLE" ? (
                    <SingleChatMessage 
                      message={message}
                      userId={userId}
                      firstPostElementRef={firstPostElementRef}
                      formatTimestamp={formatTimestamp}
                    />
                ) : (
                    <GroupChatMessage
                    message={message}
                    userId={userId}
                    firstPostElementRef= {firstPostElementRef}
                    formatTimestamp = {formatTimestamp}
                    userChat={userChat}
                    fetchUser={fetchUser}
                    />
                )
            }
            <div ref={messageEndRef} />
        </div>
    );
}

// // Add prop type validation
// Message.propTypes = {
//     message: PropTypes.arrayOf(
//         PropTypes.shape({
//             messageId: PropTypes.string.isRequired,
//             content: PropTypes.string.isRequired,
//             senderId: PropTypes.string.isRequired,
//             timestamp: PropTypes.string.isRequired
//         })
//     ).isRequired,
//     userId: PropTypes.string.isRequired
// };