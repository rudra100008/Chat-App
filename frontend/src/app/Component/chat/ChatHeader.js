import style from '../../Style/chat.module.css'
import GetGroupImage from '../GetGroupImage'
import GetUserImage from '../GetUserImage'
export default function ChatHeader({otherUserDetails,userChat,chatId,onLogout,chatName}){
    return(
        <div className={style.ChatHeader}>
            {
                userChat.chatType === "SINGLE" ? 
                (
                     <div className={style.ChatHeaderName}>
                <GetUserImage userId={otherUserDetails.userId} />
                <p className={style.chatName}>{chatName}</p>
            </div>
                )
                :
                (
                    <div className={style.ChatHeaderName}>
                        <GetGroupImage chatId={chatId}/>
                         <p className={style.chatName}>{chatName}</p>
                    </div>
                )
            }
            <div className={style.Button}>
                <button onClick={onLogout} className={style.logoutButton}>Logout</button>
            </div>
        </div>
    )
}