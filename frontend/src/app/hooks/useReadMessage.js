import { headers } from "next/headers";
import { useCallback, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const useReadMessage = ({userId,stompClientRef,chatId}) => {
    const {token} = useAuth();
    const observerRef = useRef(null);
    const observeredMessage = useRef(new Set());
    const messageRef = useRef(new Map());

    useEffect(()=>{
        observeredMessage.current.clear();
        messageRef.current.clear();
    },[chatId])

    useEffect(()=>{
        observerRef.current = new IntersectionObserver((entries)=>{
            entries.forEach(entry=>{
                const msgId = entry.target.dataset.messageId;
                const senderId = entry.target.dataset.senderId;
                if(entry.isIntersecting && !observeredMessage.current.has(msgId) && userId !== senderId ){
                    observeredMessage.current.add(msgId);
                    const messageSend ={
                        senderId:senderId,
                        messageId: msgId,
                        chatId: chatId
                    }
                   try{
                    const client = stompClientRef.current;
                    client.publish({
                        destination : "/app/messageRead",
                        headers :{ Authorization : `Bearer ${token}`},
                        body : JSON.stringify(messageSend)
                    })
                      console.log("Message read successfully");
                   }catch(error){
                    console.error("Failed to read message",error)
                   }
                }
            })
        },
        {threshold : 0.5}
    )

    return ()=>{
        if(observerRef.current){
            observerRef.current.disconnect();
        }
    }
    },[userId,stompClientRef,chatId])

    const registerMessage = useCallback ((element , messageId) => {
        if(element && observerRef.current){
            messageRef.current.set(messageId,element);
            observerRef.current.observe(element);
        }
    },[])

    return {registerMessage}
}
export default useReadMessage;