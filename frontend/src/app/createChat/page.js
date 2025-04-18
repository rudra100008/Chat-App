"use client"
import { useState } from 'react'
import style from '../Style/createChat.module.css'

export default function CreateChat(){
    const [chat,setChat] = useState({
        chatName:"",
        chatType:"",
        participantIds:[],
        messageIds:[]
    })
    return(
        <div className={style.Container}>
            <div className={style.Form}>
                <div className={style.FormGroup}>
                    <label htmlFor="chatname">Chatname</label>
                    <input 
                    type="text"
                    name='chatname'
                    id='chatname'
                    value={chat.chatName} />
                </div>
                <div className={style.FormGroup}>
                    <label htmlFor="chatname">Chatname</label>
                    <input 
                    type="text"
                    name='chatname'
                    id='chatname'
                    value={chat.chatName} />
                </div>
                <div className={style.FormGroup}>
                    <label htmlFor="chatname">Chatname</label>
                    <input 
                    type="text"
                    name='chatname'
                    id='chatname'
                    value={chat.chatName} />
                </div>
                <div className={style.FormGroup}>
                    <button type='submit'>Create Chat</button>
                </div>
            </div>

        </div>
       
    )
}