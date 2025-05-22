"use client"
import { useState } from 'react'
import style from '../../Style/chat.module.css'
import ChatHeader from './ChatHeader'
import Message from './Message';
import ChatInput from './ChatInput';
import useWebSocket from '@/app/hooks/useWebSocket';
import useMessages from '@/app/hooks/useMessage';
import useChatDetails from '@/app/hooks/useChatDetails';

export default function ChatContainer({ chatId, userId, token, setOtherUserDetails, otherUserDetails, onLogout }) {
    const [value, setValue] = useState('');
    const { messages, setMessages, loading, firstMessageElementRef } = useMessages({ userId, token, chatId });
    const { connected, stompClient, error } = useWebSocket({ userId, chatId, token, messages, setMessages });
    const { userChat } = useChatDetails({ chatId, token, userId, setOtherUserDetails })
    const onChange = (e) => {
        setValue(e.target.value);
    }

    const onSend = () => {
        if (!value.trim() || !connected) return
        const messageDTO = {
            senderId: userId,
            chatId: chatId,
            content: value.trim()
        }

        try {
            stompClient.send("/app/chat.sendMessage", {
                Authorization: `Bearer ${token}`
            },
                JSON.stringify(messageDTO))
            setValue('')
        } catch (error) {
            console.log("Fail to send message:\n", error);
        }
    }

    if (error) {
        return <div className={style.error}>{error}</div>
    }
    return (
        <div className={style.ChatContainer}>
            <ChatHeader
                otherUserDetails={otherUserDetails}
                userChat={userChat}
                onLogout={onLogout} />
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