"use client"
import { faClose, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/memberDetail.module.css";
import Portal from "../Portal";
import GetUserImage from "../GetUserImage";
import { handlePromoteUser, handleRemoveUser } from "@/app/services/memberService";
import { useAuth } from "@/app/context/AuthContext";


const MemberDetail = ({ user, onClose, checkChatAdmin, chatData, setChatData }) => {
    const { userId, logout } = useAuth();
    
    const handleRemove = async() => {
        const  updatedChatData = await handleRemoveUser( logout, user, chatData);
        if(updatedChatData){
            setChatData(prev =>({
                ...prev,
                participantIds:updatedChatData.participantIds,
                adminIds:updatedChatData.adminIds
            })
            )
        }
        onClose();
    }
    const handlePromote = async() => {
        const updatedChatData = await handlePromoteUser(  logout, user, chatData);

        if (updatedChatData) {
            setChatData(prev =>
                prev.chatId === updatedChatData.chatId ? updatedChatData : prev
            )
        }
    }
     return (
        <Portal>
            <div className={style.memberOverlay}>
                <div className={style.memberContainer}>
                    <button className={style.closeButton} onClick={onClose} aria-label="Close">
                        <FontAwesomeIcon icon={faClose} />
                    </button>

                    <div className={style.image}>
                        <GetUserImage userId={user.userId} size={130} />
                    </div>

                    <div className={style.userInfo}>
                        <p className={style.username}>{user.username}</p>
                        {checkChatAdmin(user) && (
                            <p className={style.adminLabel}>Admin</p>
                        )}
                    </div>

                    <div className={style.userInfoDisplay}>
                        <FontAwesomeIcon icon={faPhone} />
                        <p>{user?.phoneNumber}</p>
                    </div>
                    <div className={style.userInfoDisplay}>
                        <FontAwesomeIcon icon={faEnvelope} />
                        <p>{user?.email}</p>
                    </div>

                    <button className={`${style.buttonGroup} ${style.removeButton}`} onClick={handleRemove}>
                        <p>Remove User {user.username}</p>
                    </button>
                    <button className={`${style.buttonGroup} ${style.promoteButton}`} onClick={handlePromote}>
                        <p>Promote User {user.username}</p>
                    </button>
                </div>
            </div>
        </Portal>
    );
};

export default MemberDetail;