
import style from "../../Style/chat.module.css";


const SingleChatMessage = ({ message, firstPostElementRef, formatTimestamp ,userId}) => {
    return (
        <>
            {
                message.length === 0 ? (
                    <div className={style.EmptyState}>Start messaging </div>
                ) : (
                    message.map((msg, index) => (
                        <div
                            ref={index === 0 ? firstPostElementRef : null}
                            key={msg.messageId}
                            className={`${style.Message} ${msg.senderId === userId ? style.SentMessage : style.ReceivedMessage}`}
                        >
                            <div className={style.MessageContent}>
                                {msg.content}
                            </div>
                            <div className={style.MessageTimestamp}>
                                {formatTimestamp(msg.timestamp)}
                            </div>
                        </div>
                    ))
                )
            }
        </>
    )
}

export default SingleChatMessage;