import style from '../../Style/chat.module.css'
import GetUserImage from '../GetUserImage'
export default function ChatHeader({otherUserDetails,userChat,onLogout,chatName}){
    return(
        <div className={style.ChatHeader}>
            <div className={style.ChatHeaderName}>
                <GetUserImage userId={otherUserDetails.userId} />
                <p className={style.chatName}>{chatName}</p>
            </div>
            <div className={style.Button}>
                <button onClick={onLogout} className={style.logoutButton}>Logout</button>
            </div>
        </div>
    )
}