"use client"
import { useEffect, useState } from "react"
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import style from "../Style/userChats.module.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import GetUserImage from "./GetUserImage";

export default function UserChats({userId,token,onChatSelect,otherUserId}){
    const [chatInfo,setChatInfo] = useState([]);
    const [selectedChat,setSelectedChat] = useState(null);
    const [showbox,setShowBox] = useState(false);
    const [otherUser,setOtherUser] = useState([]);

    // const getOtherUser =()=>{
    //     const otherUser = chatInfo.
    // }
    const fetchUserChats=async()=>{
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/user/${userId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log('Response of userChats:',response.data);
            setChatInfo(response.data);
        }catch(error){
            console.log(error.response.data)
        }
    }
    const getOtherUser =(chat)=>{
       return chat.participantIds.filter(pIds=> pIds !== userId)[0];
    }

    const handleChatClick=(chatId)=>{
        console.log("handleChatClick",chatId)
        setSelectedChat(chatId);
        onChatSelect(chatId);
    }
    const handleEllipseVClick=()=>{
      setShowBox((prevState)=>!prevState);
    }
    useEffect(()=>{
        fetchUserChats();
    },[userId,token])
    return(
        <div>
            <div className={style.Container}>
                <div className={style.Section}>
                    <div className={style.faEllipsisV} onClick={handleEllipseVClick}>
                    <FontAwesomeIcon  icon={faEllipsisV}  />

                    </div>
                    {showbox && 
                       <>
                       <div className={style.ShowBox}>
                          <p><Link href="/createChat">Create chat</Link></p> 
                          <p><Link href="/setting">Setting</Link></p>
                          <p><Link href="/profile">Profile</Link></p>
                       </div>
                       </>
                    }
                    
                </div>
                {chatInfo.length === 0 ? <p className={style.errorMessage}>No chats available</p>:(
                    <div>
                        {chatInfo.map((chat)=>(
                            <div 
                            className={`${style.ChatContainer} ${selectedChat === chat.chatId ? style.active :''}`} 
                            key={chat.chatId}
                            onClick={()=>handleChatClick(chat.chatId)}>
                                <GetUserImage userId={getOtherUser(chat)} />
                                <p>{chat.chatName}</p>
                            </div>
                        ))}      
                    </div>
                )}
            </div>
        </div>
    )
}