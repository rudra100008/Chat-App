"use client"
import { useRef, useState } from 'react'
import style from '../../Style/chat.module.css'
import SingleChatMessage from './SingleChatMessage';
import GroupChatMessage from './GroupChatMessage';
import axiosInterceptor from '../Interceptor';
import { useEffect } from 'react';

export default function Message({ messages, setMessages, userId, loading, firstPostElementRef, userChat, initialLoad }) {
    const messageEndRef = useRef(null);
    const containerRef = useRef(null);
    const prevScrollHeight = useRef(0);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const prevMessagesLength = useRef(0);

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const maintainScrollHeight = () => {
        if (containerRef.current) {
            const container = containerRef.current;
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - prevScrollHeight.current;
            container.scrollTop = container.scrollTop + scrollDiff;
            prevScrollHeight.current = newScrollHeight;
        }
    };

    const checkIfNearBottom = () => {
        if (!containerRef.current) return true;
        const container = containerRef.current;
        const position = container.scrollHeight - container.scrollTop - container.clientHeight;
        return position < 100;
    };

    const fetchUser = async (userId) => {
        try {
            const response = await axiosInterceptor.get(`/api/users/${userId}`);
            return response.data;
        } catch (error) {
            console.log("Message: error fetching user:", error.response?.data?.message);
        }
    };

    useEffect(() => {
        if (containerRef.current && !loading) {
            prevScrollHeight.current = containerRef.current.scrollHeight;
        }
    }, [messages.length]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleScroll = () => setIsNearBottom(checkIfNearBottom());
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        if (initialLoad && messages.length > 0) {
            scrollToBottom();
            return;
        }

        if (messages.length > prevMessagesLength.current) {
            if (isNearBottom) scrollToBottom();
        } else if (loading) {
            maintainScrollHeight();
        }
        prevMessagesLength.current = messages.length;
    }, [messages, initialLoad, loading, isNearBottom]);

    return (
        <div ref={containerRef} className={style.MessageContainer}>
            {loading && (
                <div className={style.LoadingIndicator}>Loading older messages...</div>
            )}
            {userChat.chatType === "SINGLE" ? (
                <SingleChatMessage
                    message={messages}
                    setMessages={setMessages}   // ← passed down for optimistic updates
                    userId={userId}
                    firstPostElementRef={firstPostElementRef}
                    userChat={userChat}
                />
            ) : (
                <GroupChatMessage
                    message={messages}
                    setMessages={setMessages}   // ← passed down for optimistic updates
                    userId={userId}
                    firstPostElementRef={firstPostElementRef}
                    userChat={userChat}
                    fetchUser={fetchUser}
                />
            )}
            <div ref={messageEndRef} />
        </div>
    );
}