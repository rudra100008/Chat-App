import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/chatInfoDisplay.module.css";
import GetGroupImage from "../GetGroupImage";
import { faEdit } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
const GroupChat = ({ chatData }) => {
    const [showEditChat,setShowEditChat] = useState(false);
    const handleEditChat = ()=>{
        setShowEditChat(prev=> !prev);
    }
    return (
        <div className={style.infoDisplayContainer}>
            <div className={style.faEdit}>
                <FontAwesomeIcon icon={faEdit} size="lg" onClick={handleEditChat}/>
            </div>
            <div className={style.image}>
                <GetGroupImage chatId={chatData.chatId} size={120} />
            </div>
            <p className={style.chatName}>{chatData.chatName}</p>
            <div className={style.chatInfoDisplay}>
                {/* <FontAwesomeIcon icon={}/> */}
                <p>{
                    new Date(chatData.createdAt).toLocaleDateString("en-us",{
                        day : "2-digit",
                        month : '2-digit',
                        year: "numeric"
                    }) || "unknown time"
                    }</p>
            </div>
        </div>
    )
}

export default GroupChat;