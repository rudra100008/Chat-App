import { useWebSocket } from "@/app/context/WebSocketContext";
import style from "../../Style/chat.module.css";
import useReadMessage from "@/app/hooks/useReadMessage";
import MessageBubble from "../MessageBubble";

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

const SingleChatMessage = ({ message, firstPostElementRef, userId, userChat, setMessages }) => {
    const { stompClientRef } = useWebSocket();
    const { registerMessage } = useReadMessage({ userId, stompClientRef, chatId: userChat.chatId });

    if (message.length === 0) {
        return <div className={style.EmptyState}>Send a message to start chatting</div>;
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
                            <MessageBubble
                                msg={msg}
                                isSent={isSent}
                                userId={userId}
                                setMessages={setMessages}
                                isLastInGroup={isLastInGroup}
                                isGrouped={isGrouped}
                            />
                        </div>
                    </div>
                );
            })}
        </>
    );
};

export default SingleChatMessage;