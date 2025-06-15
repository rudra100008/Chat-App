"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/chatInfoDisplay.module.css'
import GetUserImage from '../GetUserImage';
import { faClock, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';


const SingleChat = ({otherUserId,otherUserData,lastSeen,status,formatLastSeen ,chatData}) => {
    return (
        <div className={style.infoDisplayContainer}>
            <div className={style.image}>
                <GetUserImage userId={otherUserId(chatData)} size={140} />
            </div>
            <p className={style.chatName}>{chatData.chatName}</p>
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faPhone} />
                <p>{otherUserData?.phoneNumber || "Unkown PhoneNumber"}</p>
            </div>
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faEnvelope} />
                <p>{otherUserData?.email || "Unkown email"}</p>
            </div>

            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faClock}/>
                <p>{formatLastSeen(lastSeen)}</p>
            </div>

        </div>
    )
}
export default SingleChat;