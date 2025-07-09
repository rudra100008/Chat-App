
import { useEffect, useState } from "react";
import style from "../../Style/chat.module.css"
import GetGroupImage from "../GetGroupImage";
import GetUserImage from "../GetUserImage";
import AttachmentDisplay from "./AttachmentDisplay";
import { useWebSocket } from "@/app/context/WebSocketContext";
import useReadMessage from "@/app/hooks/useReadMessage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble } from "@fortawesome/free-solid-svg-icons";

const GroupChatMessage = ({ message, firstPostElementRef, formatTimestamp, userId, userChat, fetchUser }) => {
    const [userName, setUsername] = useState({});
    const { stompClientRef } = useWebSocket();
    const { registerMessage } = useReadMessage({ userId, stompClientRef, chatId: userChat.chatId })

    const loadUser = async (senderId) => {
        const { username } = await fetchUser(senderId);
        setUsername(prev => ({
            ...prev,
            [senderId]: username
        }))
    }
    useEffect(() => {
        const uniqueSender = [...new Set(message.map(msg => msg.senderId))]
        uniqueSender.forEach(senderId => {
            if (userChat.participantIds.includes(senderId)) {
                loadUser(senderId);
            }
        }
        )
    }, [message, userChat.participantIds])
    return (
        <>
            {
                message.length === 0 ? (
                    <div className={style.EmptyState}>Start messaging </div>
                ) : (
                    message.map((msg, index) => (
                        <div
                            ref={(node) => {
                                if (index === 0 && node) firstPostElementRef(node);
                                registerMessage(node, msg.messageId);
                            }
                            }
                            key={msg.messageId}
                            data-message-id={msg.messageId}
                            data-sender-id={msg.senderId}
                            className={`${style.MessageRow} ${msg.senderId === userId ? style.SentRow : ''}`}
                        >
                            {userChat.participantIds.includes(msg.senderId) && (
                                <div className={msg.senderId === userId ? style.SentImage : style.ReceivedImage}>
                                    <GetUserImage userId={msg.senderId} size={35} />
                                </div>
                            )}
                            <div className={`${style.Message} ${msg.senderId === userId ? style.SentMessage : style.ReceivedMessage}`}>
                                {
                                    msg.senderId !== userId &&
                                    (<div className={style.MessageUsername}>
                                        {userName[msg.senderId] || "Loading..."}
                                    </div>)
                                }
                                <div >
                                    {msg.content && msg.content !== "" ? (
                                        <>
                                            <div className={style.MessageContent}>
                                                {msg.content}
                                            </div>

                                        </>

                                    ) : (
                                        <AttachmentDisplay
                                            message={msg}
                                        />
                                    )}
                                </div>
                                <div className={style.MessageFooter}>
                                    <div className={style.MessageTimestamp}>
                                        {formatTimestamp(msg.timestamp)}
                                    </div>
                                    <div className={style.DoubleCheck}>
                                        {msg.read &&
                                            <FontAwesomeIcon icon={faCheckDouble} />
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )
            }
        </>
    )
}
export default GroupChatMessage;