
import { useWebSocket } from "@/app/context/WebSocketContext";
import style from "../../Style/chat.module.css";
import AttachmentDisplay from "./AttachmentDisplay";
import { useRef } from "react";
import useReadMessage from "@/app/hooks/useReadMessage";


const SingleChatMessage = ({ message, firstPostElementRef, formatTimestamp, userId, userChat }) => {
    const { stompClientRef } = useWebSocket();
    const { registerMessage } = useReadMessage({ userId, stompClientRef, chatId: userChat.chatId });
    return (
        <>
            {
                message.length === 0 ? (
                    <div className={style.EmptyState}>Start messaging </div>
                ) : (
                    message.map((msg, index) => (
                        <div
                            ref={(node) => {
                                if (index == 0) firstPostElementRef();
                                registerMessage(node, msg.messageId)
                            }}
                            key={msg.messageId}
                            data-message-id={msg.messageId}
                            data-sender-id={msg.senderId}
                            className={`${style.Message} ${msg.senderId === userId ? style.SentMessage : style.ReceivedMessage}`}
                        >
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
                            <div className={style.MessageTimestamp}>
                                {formatTimestamp(msg.timestamp)}
                            </div>

                        </div >
                    ))
                )
            }
        </>
    )
}

export default SingleChatMessage;

// About entries
// entries is an array of IntersectionObserverEntry objects, each containing:

// target: The observed DOM element
// isIntersecting: Boolean - whether element is visible
// intersectionRatio: How much of the element is visible (0-1)
// boundingClientRect: Element's bounding box
// rootBounds: Root's bounding box
// time: When the intersection occurred