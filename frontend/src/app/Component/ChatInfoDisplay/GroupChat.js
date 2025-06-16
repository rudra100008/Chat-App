import style from "../../Style/chatInfoDisplay.module.css";
import GetGroupImage from "../GetGroupImage";
const GroupChat = ({chatData}) => {
    return (
        <div className={style.infoDisplayContainer}>
            <GetGroupImage chatId={chatData.chatId} size={140} />
            <p className={style.chatName}>{chatData.chatName}</p>

        </div>
    )
}

export default GroupChat;