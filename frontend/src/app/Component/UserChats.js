"use client"
import { useEffect, useState } from "react"
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import style from "../Style/userChats.module.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";

export default function UserChats({userId,token,onChatSelect}){
    const [chatInfo,setChatInfo] = useState([]);
    const [selectedChat,setSelectedChat] = useState(null);
    const [showbox,setShowBox] = useState(false);

    // const getOtherUser =()=>{
    //     const otherUser = chatInfo.
    // }
    const fetchUserChats=async()=>{
        console.log("UseChat-> userID: ",userId)
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/user/${userId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log('Response of userChats:',response.data);
            setChatInfo(response.data)
        }catch(error){
            console.log(error.response.data)
        }
    }

    const handleChatClick=(chatId)=>{
        setSelectedChat(chatId);
        onChatSelect(chatId);
    }
    const handleEllipseVClick=()=>{
        setShowBox(!showbox);
    }
    useEffect(()=>{
        fetchUserChats();
    },[userId,token])
    return(
        <div>
            <div className={style.Container}>
                <div className={style.Section}>
                    <div className={style.faEllipsisV}>
                    <FontAwesomeIcon  icon={faEllipsisV} onClick={handleEllipseVClick} />

                    </div>
                    {showbox && 
                       <>
                       <div className={style.ShowBox}>
                          <p>Create chat</p>
                       </div>
                       </>
                    }
                    
                </div>
                {chatInfo.length === 0 ? "No chats available":(
                    <div>
                        {chatInfo.map((chat)=>(
                            <div 
                            className={`${style.ChatContainer} ${selectedChat === chat.chatId ? style.active :''}`} 
                            key={chat.chatId}
                            onClick={()=>handleChatClick(chat.chatId)}>
                                <p>{chat.chatName}</p>
                            </div>
                        ))}      
                    </div>
                )}
            </div>
        </div>
    )
}