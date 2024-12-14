"use client"
import { useEffect } from 'react'
import style from '../Style/chat.module.css'
export default function Chat(){
    useEffect(()=>{
        document.title ="Chat"
    },[])
    return(
        <div>
            <div className={style.ChatContainer}>
            <h1 className={style.headers}>Chat</h1>
             <div className={style.FieldGroup}>
             <input 
             type="text"
             name='content'
             id='content'
             placeholder='Type a message'
             className={style.FieldInput}
             />
             </div>
            </div>
        </div>
        
          
    )
}