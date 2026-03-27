import { useCallback, useEffect, useRef, useState } from "react";
import style from "../../Style/chat.module.css";
import GetGroupImage from "../GetGroupImage";
import GetUserImage from "../GetUserImage";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import useChatDetails from "@/app/hooks/useChatDetails";
import { useWebSocket } from "@/app/context/WebSocketContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone, faVideo, faEllipsisV, faCircle } from "@fortawesome/free-solid-svg-icons";

export default function ChatHeader({ otherUserDetails, chatId, onLogout, chatName }) {
  const { userId } = useAuth();
  const { userStatusMap } = useWebSocket();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const { userChat } = useChatDetails({ chatId, userId });

  const otherUserId = otherUserDetails?.userId;
  const otherStatus = userStatusMap[otherUserId];
  const isOnline = otherStatus?.status === "ONLINE";

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString("en-us", { month: "short", day: "numeric" });
  };

  const handleProfileClick = useCallback(() => {
    setShowProfileMenu((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  return (
    <div className={style.chatHeader}>
      {/* ── LEFT: other user / group info ── */}
      <div className={style.chatHeaderInfo}>
        <div className={style.headerAvatarWrap}>
          {userChat.chatType === "SINGLE" && otherUserDetails ? (
            <GetUserImage userId={otherUserDetails.userId} size={40} />
          ) : userChat.chatType === "GROUP" ? (
            <GetGroupImage chatId={userChat.chatId} chatType={userChat.chatType} size={40} />
          ) : (
            <div className={style.avatarPlaceholder} />
          )}
          {/* Online dot for single chats */}
          {userChat.chatType === "SINGLE" && (
            <span className={`${style.headerOnlineDot} ${isOnline ? style.dotOnline : style.dotOffline}`} />
          )}
        </div>

        <div className={style.headerNameBlock}>
          <p className={style.chatName}>{chatName || "..."}</p>
          {userChat.chatType === "SINGLE" && (
            <p className={isOnline ? style.statusOnline : style.statusOffline}>
              {isOnline ? "Online" : otherStatus?.lastSeen ? `Last seen ${formatLastSeen(otherStatus.lastSeen)}` : "Offline"}
            </p>
          )}
          {userChat.chatType === "GROUP" && (
            <p className={style.statusOffline}>
              {userChat.participantIds?.length || 0} members
            </p>
          )}
        </div>
      </div>

      {/* ── RIGHT: action icons + logged-in user avatar ── */}
      <div className={style.headerRight}>
        {/* Call icons */}
        <button className={style.headerIconBtn} aria-label="Voice call" title="Voice call">
          <FontAwesomeIcon icon={faPhone} />
        </button>
        <button className={style.headerIconBtn} aria-label="Video call" title="Video call">
          <FontAwesomeIcon icon={faVideo} />
        </button>

        {/* Divider */}
        <div className={style.headerDivider} />

        {/* Logged-in user avatar + dropdown */}
        <div ref={menuRef} className={style.profileSection} onClick={handleProfileClick}>
          <div className={style.myAvatarWrap}>
            <GetUserImage userId={userId} size={38} />
            <span className={`${style.headerOnlineDot} ${style.dotOnline}`} />
          </div>

          {showProfileMenu && (
            <div className={style.profileMenu}>
              <div className={style.profileMenuHeader}>
                <GetUserImage userId={userId} size={36} />
                <span className={style.profileMenuName}>My Account</span>
              </div>
              <div className={style.profileMenuDivider} />
              <Link href="/profile" className={style.profileMenuItem}>
                <span>👤</span> Profile
              </Link>
              <Link href="/setting" className={style.profileMenuItem}>
                <span>⚙️</span> Settings
              </Link>
              <div className={style.profileMenuDivider} />
              <button onClick={onLogout} className={`${style.profileMenuItem} ${style.profileMenuLogout}`}>
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}