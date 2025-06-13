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

const ChatInfoDisplay = ({ userId, token, chatData, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [otherUserData,setOtherUserData] = useState({});
    const [lastSeen,setLastSeen] = useState(null);
    const [status,setStatus] = useState(null);
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
            setLastSeen(response.data.lastSeen);
            setOtherUserData(response.data);
        }catch(error){
            const errorMessage = error?.response?.data;
            console.log(errorMessage);
        }
    }

    const formatLastSeen = (lastSeen) => {
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
        if(chatData.chatType !== "SINGLE") return
            fetchOtherUser();
            const stompClient = stompClientRef.current;
             const otherId = chatData.participantIds.find(pId => pId !== userId);
             let subscription;
             if(stompClient && stompClient.connected){
                subscription = stompClient.subscribe("/topic/user-status",(message)=>{
                    const payload = JSON.parse(message.body);
                    if(payload.userId ===  otherId){
                        setLastSeen(new Date(payload.lastSeen).toISOString())
                        setStatus(payload.status);
                    }
                })
             }
             return ()=>{
                if(subscription) subscription.unsubscribe();
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
                                <div className={style.infoDisplayContainer}>
                                    <div>
                                         <GetUserImage userId={otherUserId(chatData)} size={140} />
                                    </div>
                                    <p className={style.chatName}>{chatData.chatName}</p>
                                    <div className={style.chatInfoDisplay}>
                                        <FontAwesomeIcon icon={faPhone}/>
                                        <p>{otherUserData?.phoneNumber || "Unkown PhoneNumber"}</p>
                                    </div>
                                    <div className={style.chatInfoDisplay}>
                                        <FontAwesomeIcon icon={faEnvelope}/>
                                        <p>{otherUserData?.email || "Unkown email"}</p>
                                    </div>

                                    <div className={style.chatInfoDisplay}>
                                        {/* <FontAwesomeIcon icon={}/> */}
                                        <p>{formatLastSeen(lastSeen)}</p>
                                    </div>

                                </div>
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