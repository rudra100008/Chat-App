import { useEffect, useState } from "react";
import style from "../../Style/chat.module.css";
import GetUserImage from "../GetUserImage";
import AttachmentDisplay from "./AttachmentDisplay";
import { useWebSocket } from "@/app/context/WebSocketContext";
import useReadMessage from "@/app/hooks/useReadMessage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble, faCheck } from "@fortawesome/free-solid-svg-icons";

const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("en-us", {
        hour: "2-digit", minute: "2-digit", hour12: true
    });

const formatDateLabel = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-us", { day: "2-digit", month: "long", year: "numeric" });
};

const isSameDay = (a, b) =>
    new Date(a).toDateString() === new Date(b).toDateString();

const GroupChatMessage = ({ message, firstPostElementRef, userId, userChat, fetchUser }) => {
    const [userNames, setUserNames] = useState({});
    const { stompClientRef } = useWebSocket();
    const { registerMessage } = useReadMessage({ userId, stompClientRef, chatId: userChat.chatId });

    useEffect(() => {
        const uniqueSenders = [...new Set(message.map(m => m.senderId))]
            .filter(id => userChat.participantIds.includes(id));

        uniqueSenders.forEach(async (senderId) => {
            if (!userNames[senderId]) {
                const data = await fetchUser(senderId);
                if (data?.username) {
                    setUserNames(prev => ({ ...prev, [senderId]: data.username }));
                }
            }
        });
    }, [message, userChat.participantIds]);

    if (message.length === 0) {
        return <div className={style.EmptyState}>Start messaging</div>;
    }

    return (
        <>
            {message.map((msg, index) => {
                const isSent = msg.senderId === userId;
                const prevMsg = message[index - 1];
                const nextMsg = message[index + 1];

                const showDateSep = !prevMsg || !isSameDay(prevMsg.timestamp, msg.timestamp);
                const isGrouped = prevMsg && prevMsg.senderId === msg.senderId && !showDateSep;
                const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId ||
                    !isSameDay(msg.timestamp, nextMsg.timestamp);

                return (
                    <div key={msg.messageId}>
                        {showDateSep && (
                            <div className={style.dateSeparator}>
                                <span>{formatDateLabel(msg.timestamp)}</span>
                            </div>
                        )}
                        <div
                            ref={(node) => {
                                if (index === 0 && node) firstPostElementRef(node);
                                registerMessage(node, msg.messageId);
                            }}
                            data-message-id={msg.messageId}
                            data-sender-id={msg.senderId}
                            className={`${style.MessageRow} ${isSent ? style.SentRow : ""} ${isGrouped ? style.grouped : ""}`}
                        >
                            {/* Avatar — only show on last message in group */}
                            <div className={`${style.AvatarSlot} ${isSent ? style.SentImage : style.ReceivedImage}`}>
                                {!isSent && isLastInGroup && userChat.participantIds.includes(msg.senderId) && (
                                    <GetUserImage userId={msg.senderId} size={32} />
                                )}
                            </div>

                            <div className={`${style.Message} ${isSent ? style.SentMessage : style.ReceivedMessage} ${isLastInGroup ? style.lastInGroup : style.groupedBubble}`}>
                                {/* Show name only on first message in group */}
                                {!isSent && !isGrouped && (
                                    <div className={style.MessageUsername}>
                                        {userNames[msg.senderId] || "..."}
                                    </div>
                                )}
                                {msg.content && msg.content !== "" ? (
                                    <div className={style.MessageContent}>{msg.content}</div>
                                ) : (
                                    <AttachmentDisplay message={msg} />
                                )}
                                <div className={style.MessageFooter}>
                                    <span className={style.MessageTimestamp}>
                                        {formatTime(msg.timestamp)}
                                    </span>
                                    {isSent && (
                                        <span className={`${style.ReadReceipt} ${msg.read ? style.read : ""}`}>
                                            <FontAwesomeIcon icon={msg.read ? faCheckDouble : faCheck} />
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default GroupChatMessage;