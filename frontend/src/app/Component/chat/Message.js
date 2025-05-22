"use client"
import { useEffect, useReducer, useRef } from 'react'
import style from '../../Style/chat.module.css'

export default function Message({ message, userId , firstPostElementRef,loading}) {
    const messageEndRef = useRef(null);
    const containerRef = useRef(null);
    const prevScrollHeight = useRef(0);
    const scrollToBottom=()=>{
        messageEndRef.current?.scrollIntoView({behavior : "smooth"})
    }
   
    const maintainScrollHeight = () => {
        if(containerRef.current){
            const container = containerRef.current;
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - prevScrollHeight.current;
            container.scrollTop = container.scrollTop + scrollDiff;
            prevScrollHeight.current = newScrollHeight;
        }
    }

    useEffect(()=>{
        if(containerRef.current && !loading){
            prevScrollHeight.current = containerRef.current.scrollHeight;
        }
    },[message.length])

    useEffect(()=>{
        if(loading){
            maintainScrollHeight();
        }else{
            if(containerRef.current){
                const container  = containerRef.current;
                const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
                if(isNearBottom){
                    scrollToBottom();
                }
            }
        }
    },[message,loading])
    // Format timestamp function to avoid repetition
    const formatTimestamp = (timestamp) => {
        return new Date(timestamp).toLocaleDateString();
    };

    // Scroll to bottom whenever messages change
    useEffect(() => {
        scrollToBottom()
    }, [message]);

    return (
        <div ref={containerRef} className={style.MessageContainer}>
             {loading && (
                <div className={style.LoadingIndicator}>Loading older messages...</div>
            )}
            {message.length === 0 ? (
                <div className={style.EmptyState}>Start messaging </div>
            ) : (
                message.map((msg,index) => (
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