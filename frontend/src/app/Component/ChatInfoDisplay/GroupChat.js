import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/chatInfoDisplay.module.css";
import GetGroupImage from "../GetGroupImage";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import { useWebSocket } from "@/app/context/WebSocketContext";
const GroupChat = ({ chatData, setChatData, token, loadUserChats }) => {
    const [showEditChat, setShowEditChat] = useState(false);
    const [showEditChatName, setShowEditChatName] = useState(false);
    const [localChatData, setLocalChatData] = useState(chatData);
    const [inputWidth, setInputWidth] = useState(100);
    const inputRef = useRef(null);
    const spanRef = useRef(null);
    const fileRef = useRef(null);
    const { setChatInfo } = useWebSocket();

    const handleEditChat = () => {
        fileRef.current.click();
    }

    const handleFileChange = (event) => {
        const file  = event.target.files[0];
        if(file){
            
        }
    }
    const handleChatName = () => {
        setShowEditChatName(prev => !prev);
    }
    const handleValueChange = (e) => {
        const { name, value } = e.target;
        setLocalChatData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleUpdateGroupChat = useCallback(async () => {
        axiosInterceptor.put(`${baseUrl}/api/chats/updateGroupChat/${chatData.chatId}?chatName=${encodeURIComponent(localChatData.chatName)}`
            , {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            const newChatData = response.data;
            console.log("Chat updated")
            console.log(newChatData);
            setLocalChatData(prev => (
                prev.chatId === newChatData.chatId ? newChatData : prev
            ))
            setChatData(prev =>
                (prev.chatId === newChatData.chatId ? newChatData : prev)
            )
            loadUserChats();
            setShowEditChatName(false);
        }).catch((error) => {
            console.log(error.response)
        }).finally({

        })
    }, [chatData, localChatData])

    useEffect(() => {
        const handleClickOutSide = (event) => {
            if (showEditChatName && inputRef.current && !inputRef.current.contains(event.target)) {
                setShowEditChatName(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutSide);
        return () => {
            setLocalChatData(chatData);
            document.removeEventListener("mousedown", handleClickOutSide);
        }
    }, [showEditChatName])

    useEffect(() => {
        if (spanRef.current) {
            const width = spanRef.current.offsetWidth;
            setInputWidth(Math.max(100, width + 20));
        }
    }, [localChatData.chatName])
    return (
        <div className={style.infoDisplayContainer}>
            <div className={style.image}>
                <GetGroupImage chatId={chatData.chatId} size={120} />
                <div className={style.faEdit}>
                    <FontAwesomeIcon icon={faEdit} size="sm" onClick={handleEditChat} />
                </div>
                <input
                 type="file"
                 ref={fileRef}
                 style={{display: "none"}}
                 onChange={handleFileChange}
                 />
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
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUpdateGroupChat()
                                }
                            }}
                            style={{ width: inputWidth }}
                        />
                    </div> :
                    <p className={style.chatName} onDoubleClick={handleChatName}>{chatData.chatName}</p>
            }
            <div className={style.chatInfoDisplay}>
                {/* <FontAwesomeIcon icon={}/> */}
                <p>CreatedAt</p>
                <p>{
                    new Date(chatData.createdAt).toLocaleDateString("en-us", {
                        day: "2-digit",
                        month: '2-digit',
                        year: "numeric"
                    }) || "unknown time"
                }
                </p>
            </div>
        </div>
    )
}

export default GroupChat;