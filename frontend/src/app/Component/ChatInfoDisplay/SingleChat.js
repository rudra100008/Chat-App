"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/chatInfoDisplay.module.css'
import GetUserImage from '../GetUserImage';
import { faClock, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import axiosInterceptor from '../Interceptor';
import baseUrl from '@/app/baseUrl';
import { useAuth } from '@/app/context/AuthContext';


const SingleChat = ({ otherUserId, otherUserData, lastSeen, status, formatLastSeen, chatData, setChatData, loadUserChats }) => {
    const {userId} = useAuth();
    const [showEditChatName, setShowEditChatName] = useState(false);
    const [localChatData, setLocalChatData] = useState(chatData);
    const [inputWidth, setInputWidth] = useState(100);
    const inputRef = useRef(null);
    const spanRef = useRef(null);

    const handleShowInput = () => {
        setShowEditChatName(true);
    }
    const handleValueChange = (e) =>{
        const {name,value} = e.target;
        setLocalChatData(prev =>({
            ...prev,
            [name]: value
        }))
    }
    const handleUpdateChatName = useCallback(async () =>{
        try{
            const response = await axiosInterceptor.put(
                `${baseUrl}/api/chatName/updateChatName/${userId}/chat/${chatData.chatId}?chatName=${encodeURIComponent(localChatData.chatName)}`,
                {}, {}
            )
            const newChatName = response?.data;
            setLocalChatData(prev=>({
                ...prev,
                chatName: newChatName.chatname
            }))
            setChatData(prev =>({
                ...prev,
                chatName: newChatName.chatname
            }))
            loadUserChats();
            setShowEditChatName(false);
        }catch(error){
            console.log(error.response.data)
        }
    },[chatData, localChatData])

    useEffect(()=>{
        const handleClickOutside = (e) =>{
            if(showEditChatName && inputRef.current && !inputRef.current.contains(e.target)){
                setShowEditChatName(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return ()=>{
            setLocalChatData(chatData);
            document.removeEventListener('mousedown', handleClickOutside)
        }
    },[showEditChatName])

    useEffect(()=>{
        if(spanRef.current){
            const width = spanRef.current.offsetWidth;
            setInputWidth(Math.max(100, width + 20))
        }
    },[localChatData.chatName])

    return (
        <div className={style.infoDisplayContainer}>
            <div className={style.image}>
                <GetUserImage userId={otherUserId(chatData)} size={120} />
            </div>
            {
                showEditChatName ? (
                    <div ref={inputRef}>
                        <span ref={spanRef} className={style.hiddenSpan}>
                            {localChatData.chatName || ""}
                        </span>
                        <input
                            type='text'
                            name="chatName"
                            id='chatName'
                            value={localChatData.chatName}
                            onChange={handleValueChange}
                            className={style.InputStyle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleUpdateChatName();
                            }}
                            style={{width: inputWidth}}
                        />
                    </div>
                ) : (
                    <p className={style.chatName} onDoubleClick={handleShowInput}>
                        {chatData.chatName}
                    </p>
                )
            }
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faPhone} />
                <p>{otherUserData?.phoneNumber || "Unknown PhoneNumber"}</p>
            </div>
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faEnvelope} />
                <p>{otherUserData?.email || "Unknown Email"}</p>
            </div>
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faClock} />
                <p>{formatLastSeen(lastSeen)}</p>
            </div>
        </div>
    )
}
export default SingleChat;