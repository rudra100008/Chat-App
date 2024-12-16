"use client"
import { useEffect, useState } from 'react'
import style from '../Style/chat.module.css'
export default function Chat() {
    const [message, setMessage] = useState([])
    const [inputValue,setInputValue] = useState('');
    const handleValueChange=(e)=>{
        setInputValue(e.target.value)
    }
    return (
        <div className={style.body}>
            <div className={style.ChatContainer}>
            <div>{inputValue}</div>
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
                    <button className={style.SendButton}>
                        Send
                    </button>
                </div>
            </div>
        </div>


    )
}