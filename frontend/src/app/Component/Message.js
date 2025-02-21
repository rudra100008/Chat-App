"use client"
import { useEffect, useRef, useState } from 'react'
import style from '../Style/chat.module.css'
export default function Message({message,userId}){
    // const [message,setMessage] = useState([]);
    const messageEndRef = useRef();
   

    const scrollToBottom=()=>{
        messageEndRef.current?.scrollIntoView({behavior:"smooth"})
    }
    useEffect(()=>{
        scrollToBottom()
    },[message])
    return(
        <div className={style.MessageContainer}>
            {
                message.map((msg,key)=>(
                    <div 
                    key={key}
                    className={`${style.Message} ${msg.senderId === userId ? style.SentMessage : style.ReceivedMessage}`}
                    >
                        <div className={style.MessageContent}>
                            {msg.content}
                        </div>
                        <div>
                                {new Date(msg.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                ))
            }
            <div ref={messageEndRef}></div>
        </div>
    )
}