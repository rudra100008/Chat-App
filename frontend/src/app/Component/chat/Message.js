"use client"
import { useEffect, useReducer, useRef, useState } from 'react'
import style from '../../Style/chat.module.css'
import SingleChatMessage from './SingleChatMessage';
import GroupChatMessage from './GroupChatMessage';
import axiosInterceptor from '../Interceptor';
import baseUrl from '@/app/baseUrl';

export default function Message({ messages, setMessages, userId, loading, firstPostElementRef, userChat, initialLoad }) {
    const messageEndRef = useRef(null);
    const containerRef = useRef(null);
    const prevScrollHeight = useRef(0);
    const [userName, setUsername] = useState([]);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const prevMessagesLength = useRef(0);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    const maintainScrollHeight = () => {
        if (containerRef.current) {
            const container = containerRef.current;
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - prevScrollHeight.current;
            container.scrollTop = container.scrollTop + scrollDiff;
            prevScrollHeight.current = newScrollHeight;
        }
    }

    const checkIfNearBottom = () => {
        if (!containerRef.current) return
        const container = containerRef.current;
        const threshold = 100;
        const position = container.scrollHeight - container.scrollTop - container.clientHeight;
        return position < threshold;
    }

    const fetchUser = async (userId) => {
        try {
            const response = await axiosInterceptor.get(`/api/users/${userId}`, {
              
            })
            const userData = response.data;
            console.log("Message: UserData:\n", userData);
            return userData;
        } catch (error) {
            console.log("Message: error:\n", error.response.data.message)
        } finally {

        }
    }
    useEffect(() => {
        if (containerRef.current && !loading) {
            prevScrollHeight.current = containerRef.current.scrollHeight;
        }
    }, [messages.length])

    // Format timestamp function to avoid repetition
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleDateString();
    };

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setIsNearBottom(checkIfNearBottom());
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);


    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        // const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

        if (initialLoad && messages.length > 0) {
            scrollToBottom();
            return;
        }

        if (messages.length > prevMessagesLength.current) {
            if (isNearBottom) {
                scrollToBottom();
            }
        }
        else if (loading) {
            maintainScrollHeight()
        }
        prevMessagesLength.current = messages.length;
    }, [messages, initialLoad, loading, isNearBottom]);

    // // console.log("Message.js: UserChat:\n",userChat);
    // console.log("Scroll Top: ", containerRef?.current?.scrollTop || 0)
    return (
        <div ref={containerRef} className={style.MessageContainer}>
            {loading && (
                <div className={style.LoadingIndicator}>Loading older messages...</div>
            )}
            {
                userChat.chatType === "SINGLE" ? (
                    <SingleChatMessage
                        message={messages}
                        setMessages={setMessages}
                        userId={userId}
                        firstPostElementRef={firstPostElementRef}
                        formatTimestamp={formatTimestamp}
                        userChat={userChat}
                    />
                ) : (
                    <GroupChatMessage
                        message={messages}
                        setMessages={setMessages}
                        userId={userId}
                        firstPostElementRef={firstPostElementRef}
                        formatTimestamp={formatTimestamp}
                        userChat={userChat}
                        fetchUser={fetchUser}
                    />
                )
            }
            <div ref={messageEndRef} />
        </div>
    );
}
