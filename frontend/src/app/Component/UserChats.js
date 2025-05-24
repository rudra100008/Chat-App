"use client"
import { useEffect, useState } from "react"
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import style from "../Style/userChats.module.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisV, faSearch, faSearchDollar, faSearchPlus } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import GetUserImage from "./GetUserImage";
import { useRouter } from "next/navigation";
import SearchUser  from "./SearchUser";
import ErrorMessage from "./ErrorPrompt";

export default function UserChats({userId,token,onChatSelect,otherUserId,setShowSearchBox}){
    const router = useRouter()
    const [chatInfo,setChatInfo] = useState([]);
    const [selectedChat,setSelectedChat] = useState(null);
    const [showbox,setShowBox] = useState(false);
    const [chatNames,setChatNames] = useState({});

    // const getOtherUser =()=>{
    //     const otherUser = chatInfo.
    // }

    const fetchChatName = async(chats) => {
        const newChatName = {};

        for (const chat of chats){
            try{
                const response = await axiosInterceptor.get(`${baseUrl}/api/chatName/fetchChatName/${userId}/chat/${chat.chatId}`,{
                    headers:{Authorization: `Bearer ${token}`}
                })
                newChatName[chat.chatId] = response.data.chatname;
            }catch(error){
                console.log("Error in ChatName:\n",error.response.message);
                newChatName[chat.chatId] = "Unknown chat";
            }
        }
        setChatNames(newChatName);
    }
    const fetchUserChats=async()=>{
         if (!userId || !token) return;
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/chats/user/${userId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log('Response of userChats:',response.data);
            setChatInfo(response.data);
            fetchChatName(response.data)
        }catch(error){
            if( error.response && error.response.status === 403){
                localStorage.removeItem('token');
                localStorage.removeItem('userId')
                router.push("/")
            }else{
                console.log("ERROR from useChat:\n",error.response.message)
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
        onChatSelect(chatId,chatNames[chatId] || "Unknown chat");
    }
    const handleEllipseVClick=()=>{
      setShowBox((prevState)=>!prevState);
    }

    const handleSearchClick =() => {
        setShowSearchBox(prev => !prev);
    }
   
    useEffect(()=>{
        if(!userId || !token){
            router.push("/")
        }
        fetchUserChats();
    },[userId,token])
    return(
        <div>
            <div className={style.Container}>
                <div className={style.Section}>
                    <FontAwesomeIcon icon={faSearch}  className={style.searchButton}onClick={handleSearchClick} />
                    {/* <SearchUser onError={handleErrorMessage} /> */}
                    <div className={style.faEllipsisV} onClick={handleEllipseVClick} >
                    <FontAwesomeIcon  icon={faEllipsisV}  />
                    </div>
                    {showbox && 
                       <>
                       <div className={style.ShowBox}>
                          <Link href="/createChat">Create chat</Link> 
                          <Link href="/setting">Setting</Link>
                          <Link href="/profile">Profile</Link>
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
                                <p className={style.chatName}>{chatNames[chat.chatId] || "Loading..."}</p>
                            </div>
                        ))}      
                    </div>
                )}
            </div>
        </div>
    )
}