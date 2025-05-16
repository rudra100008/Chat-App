"use client"
import { useState } from 'react'
import style from '../../Style/chat.module.css'
import ChatHeader from './ChatHeader'
import Message from './Message';
import ChatInput from './ChatInput';
import useWebSocket from '@/app/hooks/useWebSocket';

export default function ChatContainer({ chatId, userId, token, setOtherUserDetails, otherUserDetails, onLogout }) {
    const [value, setValue] = useState('');

    const {messages,connected, stompClient,error} = useWebSocket(userId,chatId,token)
    const onChange=(e)=>{
        setValue(e.target.value);
    }
    return (
        <div className={style.ChatContainer}>
            {chatId ? (
                <>
                    <ChatHeader 
                    otherUserDetails={otherUserDetails} 
                    userChat={userChat} 
                    onLogout={onLogout}/>

                    <Message 
                    message={messages}
                    userId={userId}
                    firstPostElementRef={irstMessageElementRef}
                    loading={loading}/>

                    <ChatInput 
                    value={value}
                    onSend={onSend}
                    onChange={handleMessageChange}
                    connected={connected}/>
                </>
            ) :
                (
                    <></>
                )}

        </div>
    )

}