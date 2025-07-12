import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/chatInfoDisplay.module.css";
import GetGroupImage from "../GetGroupImage";
import { faCalendarAlt, faEdit, faUserShield } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import ErrorPrompt from "../ErrorPrompt";
import { useAuth } from "@/app/context/AuthContext";
import { fetchUserData } from "@/app/services/userService";
const GroupChat = ({ chatData, setChatData, token, loadUserChats }) => {
    const { logout } = useAuth();
    const [showEditChatName, setShowEditChatName] = useState(false);
    const [localChatData, setLocalChatData] = useState(chatData);
    const [inputWidth, setInputWidth] = useState(100);
    const inputRef = useRef(null);
    const spanRef = useRef(null);
    const fileRef = useRef(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [adminUsernames, setAdminUsernames] = useState([]);

    const handleEditChat = () => {
        fileRef.current.click();
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("image", file);
            await axiosInterceptor.post(`${baseUrl}/api/chats/uploadChatImage/${chatData.chatId}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }).then((res) => {
                console.log("File upload Successful");
                const newChatData = res.data;
                console.log("Backend Response: ", newChatData);
                setChatData(prev =>
                    (prev.chatId === newChatData.chatId ? newChatData : prev)
                );
            }).catch((error) => {
                console.log("GroupChat:\nerror:", error.response.data)
                setErrorMessage(error.response?.data?.Error || "Something Unexpected Occurred");
            })
        }
    }
    const handleChatName = () => {
        setShowEditChatName(prev => !prev);
    }
    const handleValueChange = (e) => {
        const { name, value } = e.target;
        setLocalChatData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleUpdateGroupChat = useCallback(async () => {
        axiosInterceptor.put(`${baseUrl}/api/chats/updateGroupChat/${chatData.chatId}?chatName=${encodeURIComponent(localChatData.chatName)}`
            , {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((response) => {
            const newChatData = response.data;
            console.log("Chat updated")
            console.log(newChatData);
            setLocalChatData(prev => (
                prev.chatId === newChatData.chatId ? newChatData : prev
            ))
            setChatData(prev =>
                (prev.chatId === newChatData.chatId ? newChatData : prev)
            )
            loadUserChats();
            setShowEditChatName(false);
        }).catch((error) => {
            console.log("GroupChat:\n Error", error.response);
            setErrorMessage(error.response?.data?.Error || "Something Unexpected Occurred")
        }).finally({

        })
    }, [chatData, localChatData])

    const fetchAdminUsername = async () => {
        const promises = chatData.adminIds.map((admin) => (
            fetchUserData(admin, token, logout)
        ))
        const users = await Promise.all(promises);
        const usernames = users
            .filter(user => user != null)
            .map(user => user.username)

        setAdminUsernames(usernames);
    }
    useEffect(() => {
        console.log("chatData: ", chatData)
        if (!chatData) return;
        if (chatData?.adminIds?.length > 0) {
            fetchAdminUsername();
        }
    }, [chatData.adminIds, token, logout])

    useEffect(() => {
        const handleClickOutSide = (event) => {
            if (showEditChatName && inputRef.current && !inputRef.current.contains(event.target)) {
                setShowEditChatName(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutSide);
        return () => {
            setLocalChatData(chatData);
            document.removeEventListener("mousedown", handleClickOutSide);
        }
    }, [showEditChatName])

    useEffect(() => {
        if (spanRef.current) {
            const width = spanRef.current.offsetWidth;
            setInputWidth(Math.max(100, width + 20));
        }
    }, [localChatData.chatName])
    return (
        <div className={style.infoDisplayContainer}>
            <ErrorPrompt errorMessage={errorMessage} setErrorMessage={setErrorMessage} />
            <div className={style.image}>
                <GetGroupImage chatId={chatData.chatId} selectedChatInfo={chatData} size={120} />
                <div className={style.faEdit}>
                    <FontAwesomeIcon icon={faEdit} size="sm" onClick={handleEditChat} />
                </div>
                <input
                    type="file"
                    ref={fileRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                />
            </div>
            {
                showEditChatName ?
                    <div ref={inputRef}>
                        <span ref={spanRef} className={style.hiddenSpan}>
                            {localChatData.chatName || ""}
                        </span>
                        <input
                            type="text"
                            name="chatName"
                            id="chatName"
                            value={localChatData.chatName}
                            className={style.InputStyle}
                            onChange={handleValueChange}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUpdateGroupChat()
                                }
                            }}
                            style={{ width: inputWidth }}
                        />
                    </div> :
                    <p className={style.chatName} onDoubleClick={handleChatName}>{chatData.chatName}</p>
            }
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faCalendarAlt} className={style.iconStyle} />
                <div className={style.chatInfo}>
                    <p>CreatedAt:</p>
                    <p>{
                        new Date(chatData.createdAt).toLocaleDateString("en-us", {
                            day: "2-digit",
                            month: '2-digit',
                            year: "numeric"
                        }) || "unknown time"
                    }
                    </p>
                </div>
            </div>
            <div className={style.chatInfoDisplay}>
                <FontAwesomeIcon icon={faUserShield} className={style.iconStyle} />
                <div className={style.chatInfo}>
                    <p>Admins</p>
                    <div className={style.adminList}>
                        {adminUsernames.map((username, index) => (
                            <p key={index}>{username}</p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GroupChat;