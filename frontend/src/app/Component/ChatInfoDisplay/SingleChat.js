"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/chatInfoDisplay.module.css'
import GetUserImage from '../GetUserImage';
import { faClock, faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import axiosInterceptor from '../Interceptor';
import { useAuth } from '@/app/context/AuthContext';


const SingleChat = ({ otherUserId, otherUserData, lastSeen, status, formatLastSeen, chatData, setChatData, loadUserChats }) => {
    const { userId } = useAuth();
    const [showEditChatName, setShowEditChatName] = useState(false);
    const [localChatData, setLocalChatData] = useState(chatData);
    const [inputWidth, setInputWidth] = useState(100);
    const inputRef = useRef(null);
    const spanRef = useRef(null);

    const isOnline = status === "ONLINE";

    const handleShowInput = () => setShowEditChatName(true);

    const handleValueChange = (e) => {
        const { name, value } = e.target;
        setLocalChatData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateChatName = useCallback(async () => {
        try {
            const response = await axiosInterceptor.put(
                `/api/chatName/updateChatName/${userId}/chat/${chatData.chatId}?chatName=${encodeURIComponent(localChatData.chatName)}`,
                {}, {}
            );
            const newChatName = response?.data;
            if (!newChatName) return;
            const updatedChatName = newChatName.chatname || newChatName;
            setLocalChatData(prev => ({ ...prev, chatName: updatedChatName }));
            setChatData(prev => ({ ...prev, chatName: updatedChatName }));
            loadUserChats();
            setShowEditChatName(false);
        } catch (error) {
            console.log("Error updating chat name:", error.response?.data || error.message);
        }
    }, [chatData, localChatData]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showEditChatName && inputRef.current && !inputRef.current.contains(e.target)) {
                setShowEditChatName(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            setLocalChatData(chatData);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEditChatName]);

    useEffect(() => {
        if (spanRef.current) {
            setInputWidth(Math.max(100, spanRef.current.offsetWidth + 20));
        }
    }, [localChatData.chatName]);

    return (
        <div className={style.infoDisplayContainer}>
            {/* Avatar with live status badge */}
            <div className={style.image}>
                <GetUserImage userId={otherUserId(chatData)} size={110} />
                <span className={`${style.statusBadge} ${isOnline ? style.online : style.offline}`} />
            </div>

            {/* Editable name */}
            {showEditChatName ? (
                <div ref={inputRef}>
                    <span ref={spanRef} className={style.hiddenSpan}>{localChatData.chatName || ""}</span>
                    <input
                        type="text"
                        name="chatName"
                        value={localChatData.chatName}
                        onChange={handleValueChange}
                        className={style.InputStyle}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateChatName(); }}
                        style={{ width: inputWidth }}
                        autoFocus
                    />
                </div>
            ) : (
                <p className={style.chatName} onDoubleClick={handleShowInput} title="Double-click to edit">
                    {chatData.chatName}
                </p>
            )}

            {/* Online / last seen */}
            {isOnline
                ? <p className={style.onlineStatus}>● Online</p>
                : <p className={style.offlineStatus}>Last seen {formatLastSeen(lastSeen) || "recently"}</p>
            }

            {/* Contact info cards */}
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faPhone} className={style.iconStyle} />
                <div className={style.chatInfo}>
                    <p>Phone</p>
                    <p>{otherUserData?.phoneNumber || "—"}</p>
                </div>
            </div>

            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faEnvelope} className={style.iconStyle} />
                <div className={style.chatInfo}>
                    <p>Email</p>
                    <p>{otherUserData?.email || "—"}</p>
                </div>
            </div>

            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faClock} className={style.iconStyle} />
                <div className={style.chatInfo}>
                    <p>Last Seen</p>
                    <p>{formatLastSeen(lastSeen) || "Unknown"}</p>
                </div>
            </div>
        </div>
    );
};

export default SingleChat;