"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../Style/chatInfoDisplay.module.css"
import { faClose, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import GetUserImage from "./GetUserImage";
import GetGroupImage from "./GetGroupImage";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import useUserStatus from "../hooks/useUserStatus";
import { useWebSocket } from "../context/WebSocketContext";
import SingleChat from "./ChatInfoDisplay/SingleChat";


const ChatInfoDisplay = ({ userId, token, chatData, onClose,checkOtherUserStatus,lastSeen,status,setUserStatusMap }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [otherUserData,setOtherUserData] = useState({});
    const {stompClientRef} = useWebSocket();

    const handleOverView = () => {
        setActiveTab("overview");
    }
    const handleShowGroup = () => {
        setActiveTab("group")
    }
    const handleShowMedia = () => {
        setActiveTab("media");
    }
    const otherUserId = (chat) =>{
        return chat.participantIds.find(pId=> pId !== userId);
    }

    const fetchOtherUser = async() => {
        const otherUserId  = chatData.participantIds.find(pId=> pId !== userId);
        try{
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/${otherUserId}`,{
                headers:{Authorization:`Bearer ${token}`}
            })
            console.log(response.data);
            setUserStatusMap(prev=>({
                ...prev,
                [otherUserId]:{
                    lastSeen: response.data.lastSeen,
                    status:response.data.status
                }
            }))
            setOtherUserData(response.data);
        }catch(error){
            const errorMessage = error?.response?.data;
            console.log(errorMessage);
        }
    }

    const formatLastSeen = (lastSeen) => {
        if(!lastSeen) return;
        const lastSeenDate = new Date(lastSeen);
        const today = new Date();

        const isSame = lastSeenDate.toDateString() === today.toDateString();

        if(isSame){
            return lastSeenDate.toLocaleTimeString("en-us",{
                hour:"2-digit",
                minute:"2-digit",
                hour12:true
            })
        }else{
            return lastSeenDate.toLocaleDateString("en-us",{
                day:"2-digit",
                month:"long",
                year:"numeric"
            })
        }
    }
    useEffect(()=>{
        if(chatData.chatType !== "SINGLE") return;
            fetchOtherUser();
             const otherId = chatData.participantIds.find(pid => pid !== userId);
            console.log("LastSeen:\n",lastSeen,"\nStatus:\n",status)
            const unsubscribe = checkOtherUserStatus(otherId);
           return ()=>{
            unsubscribe && unsubscribe();
           }
    },[chatData,token,userId,stompClientRef])
    return (
        <div className={style.chatInfoContainer}>
            <div className={style.leftContainer}>
                <button onClick={handleOverView}>
                    OverView
                </button>
                <button onClick={handleShowGroup}>
                    Group
                </button>
                <button onClick={handleShowMedia}>
                    Media
                </button>
            </div>
            <div className={style.rightContainer}>
                <div className={style.closeButton}>
                    <FontAwesomeIcon icon={faClose} onClick={onClose} />
                </div>
                {
                    activeTab === "overview" &&
                    <div> 
                        {
                            chatData.chatType === "SINGLE" ?
                            (
                                <SingleChat 
                                otherUserId={otherUserId}
                                otherUserData={otherUserData}
                                lastSeen={lastSeen}
                                status={status}
                                formatLastSeen={formatLastSeen}
                                chatData ={chatData}
                                />
                            ):
                            (
                                <div className={style.infoDisplayContainer}>
                                    <GetGroupImage chatId={chatData.chatId} size={140} />
                                    <p className={style.chatName}>{chatData.chatName}</p>

                                </div>
                            )
                        }
                    </div>
                }
                {
                    activeTab === "group" &&
                    <div>
                        Group Page
                    </div>
                }
                {
                    activeTab === "media" &&
                    <div>
                        Media Page
                    </div>
                }
            </div>
        </div>
    )
}
export default ChatInfoDisplay;