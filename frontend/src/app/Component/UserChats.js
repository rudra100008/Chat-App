"use client"
import { useEffect, useState } from "react"
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import style from "../Style/userChats.module.css"

export default function UserChats({userId,token}){
    const [chatInfo,setChatInfo] = useState([]);
    const [chatName,setChatName] = useState([]);

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
    useEffect(()=>{
        fetchUserChats();
    },[])
    return(
        <div>
            <div className={style.Container}>
                {chatInfo.length === 0 ? "No chats available":(
                    <div>
                        {chatInfo.map((chat)=>(
                            <div className={style.ChatContainer} key={chat.chatId}>
                                <p>{chat.chatName}</p>
                            </div>
                        ))}      
                    </div>
                )}
            </div>
        </div>
    )
}