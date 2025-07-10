"use client"
import { faClose, faEnvelope, faPhone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/memberDetail.module.css";
import Portal from "../Portal";
import GetUserImage from "../GetUserImage";


const MemberDetail = ({ user, onClose }) => {
    return (
        <Portal>
            <div className={style.memberOverlay}>
                <div className={style.memberContainer}>
                    <button className={style.closeButton}  onClick={onClose} aria-label="Close">
                        <FontAwesomeIcon icon={faClose} />
                    </button>


                    <div className={style.image}>
                        <GetUserImage userId={user.userId} size={130} />
                    </div>
                    <p className={style.username}>
                        {user.username}
                    </p>

                    <div className={style.userInfoDisplay}>
                        <FontAwesomeIcon icon={faPhone} />
                        <p>{user?.phoneNumber}</p>
                    </div>
                     <div className={style.userInfoDisplay}>
                        <FontAwesomeIcon icon={faEnvelope} />
                        <p>{user?.email}</p>
                    </div>
                    <button className={`${style.buttonGroup} ${style.removeButton}`}>
                        <p>Remove User {user.username}</p>
                    </button>
                    <button className={`${style.buttonGroup} ${style.promoteButton}`}>
                        <p>Promote User {user.username}</p>
                    </button>
                </div>
            </div>
        </Portal>
    );
};

export default MemberDetail;