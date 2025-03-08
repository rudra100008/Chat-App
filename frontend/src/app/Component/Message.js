"use client"
import { useEffect, useRef } from 'react'
import style from '../Style/chat.module.css'
import PropTypes from 'prop-types'

export default function Message({ message, userId }) {
    const messageEndRef = useRef(null);
   
    // Format timestamp function to avoid repetition
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleDateString();
    };

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [message]);

    return (
        <div className={style.MessageContainer}>
            {message.length === 0 ? (
                <div className={style.EmptyState}>No messages yet</div>
            ) : (
                message.map((msg) => (
                    <div 
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
            )}
            <div ref={messageEndRef} />
        </div>
    );
}

// // Add prop type validation
// Message.propTypes = {
//     message: PropTypes.arrayOf(
//         PropTypes.shape({
//             messageId: PropTypes.string.isRequired,
//             content: PropTypes.string.isRequired,
//             senderId: PropTypes.string.isRequired,
//             timestamp: PropTypes.string.isRequired
//         })
//     ).isRequired,
//     userId: PropTypes.string.isRequired
// };