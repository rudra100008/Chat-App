import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/chatInfoDisplay.module.css";
import GetGroupImage from "../GetGroupImage";
import {
  faCalendarAlt,
  faEdit,
  faExclamationTriangle,
  faTrashAlt,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import ErrorPrompt from "../ErrorPrompt";
import { useAuth } from "@/app/context/AuthContext";
import { fetchUserData } from "@/app/services/userService";
import { deleteChat, deleteGroupChat } from "@/app/services/chatServices";
import { useNotification } from "@/app/context/NotificationContext";
import { useWebSocket } from "@/app/context/WebSocketContext";

const GroupChat = ({ chatData, setChatData, loadUserChats, onClose }) => {
  const { logout, userId } = useAuth();
  const { chatInfos, setChatInfos } = useWebSocket();
  const [showEditChatName, setShowEditChatName] = useState(false);
  const [localChatData, setLocalChatData] = useState(chatData);
  const [inputWidth, setInputWidth] = useState(100);
  const inputRef = useRef(null);
  const spanRef = useRef(null);
  const fileRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [adminUsernames, setAdminUsernames] = useState([]);
  const { success, error } = useNotification();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => setShowDeleteConfirm(true);
  const cancelDelete = () => setShowDeleteConfirm(false);
  const confirmDelete = async () => {
    await deleteUserChat();
    setShowDeleteConfirm(false);
  };

  const handleEditChat = () => fileRef.current.click();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("imageFile", file);
      await axiosInterceptor
        .patch(`${baseUrl}/api/chats/${chatData.chatId}/uploadGroupImage/user/${userId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => {
          const newChatData = res.data;
          setChatData((prev) => (prev.chatId === newChatData.chatId ? newChatData : prev));
        })
        .catch((err) => {
          setErrorMessage(err.response?.data?.Error || "Something Unexpected Occurred");
        });
    }
  };

  const handleChatName = () => setShowEditChatName((prev) => !prev);

  const handleValueChange = (e) => {
    const { name, value } = e.target;
    setLocalChatData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateGroupChat = useCallback(async () => {
    const chatResponse = {
      chatId: localChatData.chatId,
      chatName: localChatData.chatName,
      chatType: localChatData.chatType,
      participantIds:localChatData.participantIds,
      adminIds:localChatData.adminIds,
      createdAt:localChatData.createdAt,
    }
   await axiosInterceptor
      .put(
        `${baseUrl}/api/chats/updateGroupChat/${chatData.chatId}`,
        chatResponse, {}
      )
      .then((response) => {
        const newChatData = response.data;
        setLocalChatData((prev) => (prev.chatId === newChatData.chatId ? newChatData : prev));
        setChatData((prev) => (prev.chatId === newChatData.chatId ? newChatData : prev));
        loadUserChats();
        setShowEditChatName(false);
      })
      .catch((err) => {
        setErrorMessage(err.response?.data?.Error || "Something Unexpected Occurred");
      });
  }, [chatData, localChatData]);

  const fetchAdminUsername = async () => {
    const promises = chatData.adminIds.map(async (admin) => await fetchUserData(admin, logout));
    const users = await Promise.all(promises);
    const usernames = users.filter((u) => u != null).map((u) => u.username);
    setAdminUsernames(usernames);
  };

  const deleteUserChat = async () => {
    try {
      const data = await deleteGroupChat(chatData.chatId);
      success(data.message);
      setChatInfos((prev) => {
        if (!prev || !Array.isArray(prev)) return prev;
        return prev.filter((chat) => chat.chatId !== chatData.chatId);
      });
      onClose();
    } catch (err) {
      console.log("Error in deleteChat():", err.response?.data);
    }
  };

  const checkUserAdmin = useCallback(() => {
    if (!userId || !chatData?.adminIds) { setIsAdmin(false); return; }
    setIsAdmin(chatData.adminIds.includes(userId));
  }, [userId, chatData?.adminIds]);

  useEffect(() => {
    if (!chatData) return;
    checkUserAdmin();
    if (chatData?.adminIds?.length > 0) fetchAdminUsername();
  }, [chatData, logout, checkUserAdmin]);

  useEffect(() => { checkUserAdmin(); }, [userId, checkUserAdmin]);

  useEffect(() => {
    const handleClickOutSide = (event) => {
      if (showEditChatName && inputRef.current && !inputRef.current.contains(event.target)) {
        setShowEditChatName(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutSide);
    return () => {
      setLocalChatData(chatData);
      document.removeEventListener("mousedown", handleClickOutSide);
    };
  }, [showEditChatName]);

  useEffect(() => {
    if (spanRef.current) {
      setInputWidth(Math.max(100, spanRef.current.offsetWidth + 20));
    }
  }, [localChatData.chatName]);

  return (
    <div className={style.infoDisplayContainer}>
      <ErrorPrompt errorMessage={errorMessage} setErrorMessage={setErrorMessage} />

      {/* Avatar + edit pencil */}
      <div className={style.image}>
        <GetGroupImage chatId={chatData.chatId} chatType={chatData.chatType} size={120} />
        <div className={style.faEdit}>
          <FontAwesomeIcon icon={faEdit} size="sm" onClick={handleEditChat} />
        </div>
        <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFileChange} />
      </div>

      {/* Editable group name */}
      {showEditChatName ? (
        <div ref={inputRef}>
          <span ref={spanRef} className={style.hiddenSpan}>{localChatData.chatName || ""}</span>
          <input
            type="text"
            name="chatName"
            id="chatName"
            value={localChatData.chatName}
            className={style.InputStyle}
            onChange={handleValueChange}
            onKeyDown={(e) => { if (e.key === "Enter") handleUpdateGroupChat(); }}
            style={{ width: inputWidth }}
          />
        </div>
      ) : (
        <p className={style.chatName} onDoubleClick={handleChatName}>{chatData.chatName}</p>
      )}

      {/* Created at */}
      <div className={style.chatInfoDisplay}>
        <FontAwesomeIcon icon={faCalendarAlt} className={style.iconStyle} />
        <div className={style.chatInfo}>
          <p>CreatedAt</p>
          <p>
            {new Date(chatData.createdAt).toLocaleDateString("en-us", {
              day: "2-digit", month: "2-digit", year: "numeric",
            }) || "Unknown"}
          </p>
        </div>
      </div>

      {/* Admins */}
      <div className={style.chatInfoDisplay}>
        <FontAwesomeIcon icon={faUserShield} className={style.iconStyle} />
        <div className={style.chatInfo}>
          <p>Admins</p>
          <div className={style.adminList}>
            {adminUsernames.map((username, i) => <p key={i}>{username}</p>)}
          </div>
        </div>
      </div>

      {/* Delete (admin only) */}
      {isAdmin && (
        <>
          <button className={style.deleteButton} onClick={handleDeleteClick} aria-label="Delete chat">
            <FontAwesomeIcon icon={faTrashAlt} className={style.deleteIcon} />
            Delete Chat
          </button>

          {showDeleteConfirm && (
            <div className={style.confirmDialogOverlay} onClick={cancelDelete}>
              <div className={style.confirmDialog} onClick={(e) => e.stopPropagation()}>
                <div className={style.confirmDialogIcon}>
                  <FontAwesomeIcon icon={faExclamationTriangle} />
                </div>
                <p>Are you sure you want to delete this chat? This action cannot be undone.</p>
                <div className={style.confirmButtons}>
                  <button onClick={confirmDelete}>Yes, Delete</button>
                  <button onClick={cancelDelete}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GroupChat;