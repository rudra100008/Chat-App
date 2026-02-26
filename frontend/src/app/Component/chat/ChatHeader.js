import { useCallback, useEffect, useRef, useState } from "react";
import style from "../../Style/chat.module.css";
import GetGroupImage from "../GetGroupImage";
import GetUserImage from "../GetUserImage";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import useChatDetails from "@/app/hooks/useChatDetails";

export default function ChatHeader({
  otherUserDetails,
  chatId,
  onLogout,
  chatName,
  setOtherUserDetails
}) {
  const { userId } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const {userChat} = useChatDetails({chatId,userId,setOtherUserDetails});


  const handleProfileClick = useCallback(() => {
    setShowProfileMenu((prev) => !prev);
  }, []);


  useEffect(()=>{
    const handleClickOutside = (event) =>{
      if(menuRef.current && !menuRef.current.contains(event.target)){
        setShowProfileMenu(false);
      }
    }
    if(showProfileMenu){
      document.addEventListener('mousedown',handleClickOutside)
    }

    return ()=>{
      document.addEventListener('mousedown',handleClickOutside)
    }

  },[showProfileMenu])

  return (
    <div className={style.chatHeader}>
      {userChat.chatType === "SINGLE" ? (
        <div className={style.chatHeaderInfo}>
          <GetUserImage userId={otherUserDetails.userId} />
          <p className={style.chatName}>{chatName}</p>
        </div>
      ) : userChat.chatType === "GROUP" ? (
        <div className={style.chatHeaderInfo}>
          <GetGroupImage chatId={userChat.chatId} chatType={userChat.chatType} />
          <p className={style.chatName}>{chatName}</p>
        </div>
      ) : (
        // chatType not yet loaded — render a small placeholder instead of calling image endpoints
        <div className={style.chatHeaderInfo}>
          <div style={{ width: 40, height: 40 }} />
          <p className={style.chatName}>{chatName}</p>
        </div>
      )}
      <div className={style.rightSection}>
        <div ref={menuRef} onClick={handleProfileClick} className={style.profileSection}>
          <GetUserImage userId={userId} />

          {showProfileMenu && (
          <div  ref={menuRef} className={style.profileMenu}>
            <div className={style.profileMenuItem}>
              <Link href="/profile">
                <p>Profile</p>
              </Link>
            </div>
            <div className={style.profileMenuItem}>
              <button onClick={onLogout} className={style.profileMenuItem}>
                Logout
              </button>
            </div>
          </div>
        )}
        </div>
        
      </div>
    </div>
  );
}
