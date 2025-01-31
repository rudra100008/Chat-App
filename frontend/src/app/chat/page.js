"use client"
import { useEffect, useRef, useState } from 'react'
import style from '../Style/chat.module.css'
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import axios from 'axios';
import baseUrl from '../baseUrl';
export default function Chat() {
    const [message, setMessage] = useState([])
    const [inputValue,setInputValue] = useState('');
    const [connected, setConnected] = useState(false);
    const [stompClient,setStompClient] = useState(null);
    const messagesEndRef = useRef(null);

    const userId='6756b718c318852de08f46ed';
    const chatId ='675823ef5ed46322912aad24';
    const handleValueChange=(e)=>{
        setInputValue(e.target.value)
    }

    const scrollToBottom=()=>{
        messagesEndRef.current?.scrollIntoView({behavior:'smooth'})
    }

    const fetchMessageFromChat=async()=>{
        await axios.get(`${baseUrl}/api/messages/chat/${chatId}`)
        .then((response)=>{
            const data = response.data;
            setMessage(data);
        }).catch((error)=>{
            console.error("failed to fetch message from the chat: ",error.response.data)
        })
    }
    const handleSendMessage=()=>{
        if(!inputValue.trim() || !connected) return

        const messageDTO = {
            senderId: userId,
            chatId : chatId,
            content : inputValue.trim()
        }
        stompClient.send("/app/chat.sendMessage",{},JSON.stringify(messageDTO));
        setInputValue('');
    }

    useEffect(()=>{
        fetchMessageFromChat();
        const connectWebSocket = ()=>{
            const client = Stomp.over(() => new SockJS('http://localhost:8080/server'));


            client.connect({},()=>{
                setConnected(true);
                setStompClient(client);
                client.subscribe(`/private/chat/${chatId}`,(message)=>{
                    console.log("Recieved Message:",message.body)
                    const receivedMessage = JSON.parse(message.body)
                    setMessage((prevMessage)=>[...prevMessage,receivedMessage]);
                })
            },(error)=>{
                console.error('WebSocket connection error:',error);
                setConnected(false)
            })
            return client;
        }
        const client  = connectWebSocket();
        return ()=>{
            if(client && client.connected){
                client.disconnect();
            }
        }
    },[])
    useEffect(()=>{
        scrollToBottom()
    },[message])
    return (
        <div className={style.body}>
            <div className={style.ChatContainer}>
            {/*Message Display area */}
            <div className={style.MessageContainer}>
            {message.map((msg,index)=>(
                <div 
                key={index}
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
            <div ref={messagesEndRef}/>
            </div>
            {/*Input Area */}
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
                        onKeyPress={(e)=> e.key === "Enter" && handleSendMessage()}
                    />
                </div>
                <div className={style.ButtonGroup}>
                    <button 
                    className={style.SendButton}
                    onClick={handleSendMessage}
                    disabled ={!connected}
                    >
                        Send
                    </button>
                </div>
               </div>
            </div>
        </div>


    )
}