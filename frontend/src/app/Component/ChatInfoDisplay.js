"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../Style/chatInfoDisplay.module.css"
import { faClose } from "@fortawesome/free-solid-svg-icons";

const ChatInfoDisplay = ({chatData,onClose}) =>{
    return(
        <div className={style.chatInfoContainer}>
            <div>
                <FontAwesomeIcon icon={faClose} onClick={onClose}/>
            </div>
            {chatData.chatName}
            hello

        </div>
    )
}
export default ChatInfoDisplay;