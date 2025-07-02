"use client"
import { useCallback, useEffect, useRef, useState } from 'react'
import style from '../../Style/chat.module.css'
import ChatHeader from './ChatHeader'
import Message from './Message';
import ChatInput from './ChatInput';
import useMessages from '@/app/hooks/useMessage';
import useChatDetails from '@/app/hooks/useChatDetails';
import { useRouter } from 'next/navigation';
import useChatWebSocket from '@/app/hooks/useChatWebSocket';
import axiosInterceptor from '../Interceptor';
import baseUrl from '@/app/baseUrl';

export default function ChatContainer({ chatId, userId, token, setOtherUserDetails, otherUserDetails, onLogout, chatName }) {
    const router = useRouter();
    const [value, setValue] = useState('');
    const [currentChatId, setCurrentChatId] = useState(null);
    const { messages, setMessages, loading, firstMessageElementRef, resetState } = useMessages({ userId, token, chatId });
    const { connected, stompClient, error, } = useChatWebSocket({ userId, chatId, token, messages, setMessages, router });
    const { userChat } = useChatDetails({ chatId, token, userId, setOtherUserDetails })
    const fileRef = useRef(null);


    const onChange = (e) => {
        setValue(e.target.value);
    }

    const handleAttachmentClick = () => {
        fileRef.current.click();
    }

    const handleAttachmentChange = async (e) => {
        const file = e.target.files[0];

        const formData = new FormData();
        formData.append("senderId", userId);
        formData.append("chatId", chatId);
        formData.append("file", file);

        if (file) {
            await axiosInterceptor.post(`${baseUrl}/api/attachments/upload`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }).then((response) => {
                console.log(response.data);
            }).catch((error) => {
                if (error.response) {
                    
                    console.log("Backend error:", error.response.data);
                } else if (error.request) {
                    
                    alert("Upload failed: File may be larger than 25MB or server did not respond.");
                    console.error("No response received:", error.message);
                } else {
                   
                    console.error("Error in setting up the request:", error.message);
                }
            });

        }
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
        const chatClient = stompClient;

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
    }, [value, connected, chatId, userId, token, stompClient]);


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
                        userChat={userChat}
                        token={token}
                        loading={loading} />

                    <ChatInput
                        value={value}
                        onSend={onSend}
                        onChange={onChange}
                        fileRef={fileRef}
                        handleAttachmentChange={handleAttachmentChange}
                        handleAttachmentClick={handleAttachmentClick}
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