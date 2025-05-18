"use client"
import { useEffect, useState } from "react"
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import style from "../Style/userChats.module.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import GetUserImage from "./GetUserImage";
import { useRouter } from "next/navigation";
import SearchUser  from "./SearchUser";
import ErrorMessage from "./ErrorMessage";

export default function UserChats({userId,token,onChatSelect,otherUserId}){
    const router = useRouter()
    const [chatInfo,setChatInfo] = useState([]);
    const [selectedChat,setSelectedChat] = useState(null);
    const [showbox,setShowBox] = useState(false);
    const [errorMessage,setErrorMessage] = useState('');

    // const getOtherUser =()=>{
    //     const otherUser = chatInfo.
    // }
    const fetchUserChats=async()=>{
         if (!userId || !token) return;
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/user/${userId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log('Response of userChats:',response.data);
            setChatInfo(response.data);
        }catch(error){
            if(error.response.status ==='403'){
                localStorage.removeItem('token');
                localStorage.removeItem('userId')
                router.push("/")
            }
            console.log("Error from UserChat.js:",error.response.data)
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

    const handleErrorMessage=(message)=>{
        setErrorMessage(message);
    }

    const closeErrorMessage=()=>{
        setErrorMessage("");
    }

    useEffect(()=>{
        if(!userId || !token){
            router.push("/")
        }
        fetchUserChats();
    },[userId,token])
    return(
        <div>
            <ErrorMessage errorMessage={errorMessage} onClose={closeErrorMessage}/>
            <div className={style.Container}>
                <div className={style.Section}>
                    <SearchUser onError={handleErrorMessage} />
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
                                <p className={style.chatName}>{chat.chatName}</p>
                            </div>
                        ))}      
                    </div>
                )}
            </div>
        </div>
    )
}