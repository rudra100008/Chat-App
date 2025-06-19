import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/chatInfoDisplay.module.css";
import GetGroupImage from "../GetGroupImage";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
const GroupChat = ({ chatData }) => {
    const [showEditChat,setShowEditChat] = useState(false);
    const [showEditChatName,setShowEditChatName] = useState(false);
    const [localChatData,setLocalChatData] = useState(chatData);
    const [inputWidth,setInputWidth] = useState(100);
    const inputRef = useRef(null);
    const spanRef = useRef(null);

    const handleEditChat = ()=>{
        setShowEditChat(prev=> !prev);
    }
    const handleChatName = () => {
        setShowEditChatName(prev => !prev);
    }
    const handleValueChange = (e) =>{
        const {name,value} = e.target;
        setLocalChatData(prev=>({
            ...prev,
            [name]:value
        }))
    }

    useEffect(()=>{
        const handleClickOutSide = (event) =>{
            if(showEditChatName && inputRef.current && !inputRef.current.contains(event.target)){
                setShowEditChatName(false);
            }
        }
        document.addEventListener("mousedown",handleClickOutSide);
        return ()=>{
            setLocalChatData(chatData);
            document.removeEventListener("mousedown",handleClickOutSide);
        }
    },[showEditChatName])

    useEffect(()=>{
        if(spanRef.current){
            const width = spanRef.current.offsetWidth;
            setInputWidth(Math.max(100,width+20));
        }
    },[localChatData.chatName])
    return (
        <div className={style.infoDisplayContainer}>
            <div className={style.faEdit}>
                <FontAwesomeIcon icon={faEdit} size="lg" onClick={handleEditChat}/>
            </div>
            <div className={style.image}>
                <GetGroupImage chatId={chatData.chatId} size={120} />
            </div>
            {
                showEditChatName ? 
                <div ref={inputRef}>
                    <span ref={spanRef} className={style.hiddenSpan}>
                        {localChatData.chatName || ""}
                    </span>
                <input 
                type="text"
                name="chatName"
                id="chatName"
                value={localChatData.chatName}
                className={style.InputStyle}
                onChange={handleValueChange}
                style={{width:inputWidth}}
                />
                </div> :
                <p className={style.chatName} onDoubleClick={handleChatName}>{chatData.chatName}</p>
            }
            <div className={style.chatInfoDisplay}>
                {/* <FontAwesomeIcon icon={}/> */}
                <p>CreatedAt</p>
                <p>{
                    new Date(chatData.createdAt).toLocaleDateString("en-us",{
                        day : "2-digit",
                        month : '2-digit',
                        year: "numeric"
                    }) || "unknown time"
                    }
                </p>
            </div>
        </div>
    )
}

export default GroupChat;