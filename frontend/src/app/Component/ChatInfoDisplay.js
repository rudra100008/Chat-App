"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../Style/chatInfoDisplay.module.css"
import { faClose, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";
import GetUserImage from "./GetUserImage";
import GetGroupImage from "./GetGroupImage";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";

const ChatInfoDisplay = ({ userId, token, chatData, onClose }) => {
    const [activeTab, setActiveTab] = useState("overview");
    const [otherUserData,setOtherUserData] = useState({});
    const [lastSeen,setLastSeen] = useState(null);

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
            setLastSeen(response.data.lastSeen)
            setOtherUserData(response.data);
        }catch(error){
            const errorMessage = error?.response?.data;
            console.log(errorMessage);
        }
    }
    useEffect(()=>{
        if(chatData.chatType === "SINGLE"){
            fetchOtherUser();
        }
    },[chatData,token,userId])
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
                                        {
                                            new Date(lastSeen).toLocaleDateString > new Date() 
                                            ? 
                                            (
                                                <p>{new Date(lastSeen).toLocaleTimeString("en-us",{
                                                    hour:"2-digit",
                                                    minute:"2-digit",
                                                    hour12:true
                                                })}</p>
                                            ):
                                            (
                                                <p>
                                                    <p>{new Date(lastSeen).toLocaleDateString("en-us",{
                                                    day:"2-digit",
                                                    month:"long",
                                                    year:"numeric"
                                                })}</p>
                                                </p>
                                            )
                                        }
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