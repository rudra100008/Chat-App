"use client"
import { useCallback, useEffect, useState } from 'react'
import style from '../../Style/chat.module.css'
import ChatHeader from './ChatHeader'
import Message from './Message';
import ChatInput from './ChatInput';
import useWebSocket from '@/app/hooks/useWebSocket';
import useMessages from '@/app/hooks/useMessage';
import useChatDetails from '@/app/hooks/useChatDetails';
import { useRouter } from 'next/navigation';

export default function ChatContainer({ chatId, userId, token, setOtherUserDetails, otherUserDetails, onLogout, chatName }) {
    const router = useRouter();
    const [value, setValue] = useState('');
    const [currentChatId, setCurrentChatId] = useState(null);
    const { messages, setMessages, loading, firstMessageElementRef, resetState } = useMessages({ userId, token, chatId });
    const { connected, stompClient, error, chatStompClientRef } = useWebSocket({ userId, chatId, token, messages, setMessages ,router});
    const { userChat } = useChatDetails({ chatId, token, userId, setOtherUserDetails })
    const onChange = (e) => {
        setValue(e.target.value);
    }

    useEffect(() => {
        if (chatId && chatId !== currentChatId) {
            console.log("ChatContainer: Switching to new chat:", chatId);
            setCurrentChatId(chatId);
        }
    }, [chatId, currentChatId]);


    const onSend = useCallback(() => {
        console.log("=== SEND MESSAGE DEBUG ===");
        console.log("message send:", value);
        console.log("connected:", connected);
        console.log("chatId:", chatId);

        if (!value.trim() || !connected) {
            console.log("Early return: no value or not connected");
            return;
        }

        const messageDTO = {
            senderId: userId,
            chatId: chatId,
            content: value.trim()
        };

        // Use the chat client ref from the hook
        const chatClient = chatStompClientRef.current;

        console.log("Chat client details:", {
            exists: !!chatClient,
            active: chatClient?.active,
            connected: chatClient?.connected
        });

        if (!chatClient?.active) {
            console.log("Chat client not ready");
            return;
        }

        try {
            console.log("Sending message via chat client:", messageDTO);
            chatClient.publish({
                destination: "/app/chat.sendMessage",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(messageDTO)
            });

            console.log("Message sent successfully");
            setValue('');
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    }, [value, connected, chatId, userId, token, chatStompClientRef]);


    if (error) {
        return <div className={style.error}>{error}</div>
    }
    return (
        <div className={style.ChatContainer}>
            <ChatHeader
                otherUserDetails={otherUserDetails}
                chatId={chatId}
                userChat={userChat}
                onLogout={onLogout}
                chatName={chatName} />
            {chatId ? (
                <>
                    <Message
                        message={messages}
                        userId={userId}
                        firstPostElementRef={firstMessageElementRef}
                        loading={loading} />

                    <ChatInput
                        value={value}
                        onSend={onSend}
                        onChange={onChange}
                        connected={connected} />
                </>
            ) :
                (
                    <>
                        <div className={style.selectChatPrompt}>
                            Select a chat to start messaging
                        </div>
                    </>
                )}

        </div>
    )

}