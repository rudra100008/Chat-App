"use client"
import { faL } from "@fortawesome/free-solid-svg-icons";
import baseUrl from "../baseUrl";
import axiosInterceptor from "../Component/Interceptor";

const { useState, useRef, useCallback, useEffect } = require("react")

const useMessages = ({userId,token,chatId})=>{
    const [messages,setMessages] = useState([]);
    const [loading,setLoading] = useState(false);
    const [hasMore,setHasMore] = useState(true);
    const [initialLoad,setInitialLoad] = useState(true);
    const [page,setPage] = useState(0);
    const [totalPage,setTotalPage] = useState(null);
    const observer = useRef(null);
    const currentChatIdRef = useRef(null);


    const removeDuplicateMessage =(messageArray) => {
        const uniqueMessage = [];
        const seenIds = new Set();

        messageArray.forEach(message => {
            if(!seenIds.has(message.messageId)){
                seenIds.add(message.messageId);
                uniqueMessage.push(message);
            }
        })
        return uniqueMessage;
    }

      const resetState = useCallback(() => {
        setMessages([]);
        setLoading(false);
        setHasMore(true);
        setInitialLoad(true);
        setPage(0);
        setTotalPage(null);
    }, []);

    useEffect(()=>{
        if(chatId && chatId !== currentChatIdRef.current){
            currentChatIdRef.current = chatId;
            resetState();
        }else if(!chatId){
            resetState();
            currentChatIdRef.current = null;
        }
    },[chatId,resetState])
    
    const intialFetch=useCallback(async()=>{
         if (!chatId || !userId || !token) return;
         if (currentChatIdRef.current !== chatId) return;

        setLoading(true);
        try{
             const response = await axiosInterceptor.get(`${baseUrl}/api/messages/chat/${chatId}?latest=true`,{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })
        console.log("Message from useMessage:\n",response.data)
        const {data,totalPage} = response.data
        setMessages(data || []);
        setTotalPage(totalPage);
        setPage(totalPage > 1 ?totalPage - 2: -1 );
        if(totalPage <= 1){
            setHasMore(false);
        }
        setInitialLoad(false);

        }catch(error){
            console.error("Error fetching initial Messages:\n",error.response.data)
        }finally{
            setLoading(false);
        }
    },[userId,token,chatId])

    const fetchOlderMessages= useCallback(async()=>{
        if(loading || page < 0) return ;
        setLoading(true);

        try{
            const response = await  axiosInterceptor.get(
                `${baseUrl}/api/messages/chat/${chatId}?latest=false&pageNumber=${page}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })
            if(page<=0){
                setHasMore(false);
            }
            const {data} = response.data;
            if(data &&  data.length >0 && page >=0){
                setPage(prev=>prev-1);
                setMessages(prev=>{
                   const messageArray =  [...data,...prev];
                   return removeDuplicateMessage(messageArray)
                })
            }else if(data && data.length === 0){
                setHasMore(false)
            }
        }catch(error){
            console.log("Error occured fetching older messages:\n",error.response.data)
        }finally{
            setLoading(false)
        }
    },[loading,page,chatId,token]);

    const firstMessageElementRef = useCallback(
        (node)=>{
            if(loading) return;
            if(observer.current) observer.current.disconnect();

            if(typeof window !== 'undefined'){
                observer.current = new IntersectionObserver(
                    (entries)=>{
                        if(entries[0].isIntersecting && !loading && hasMore && page>=0 ){
                            fetchOlderMessages();
                        }
                    },
                {threshold:0.5}
                )
                if(node) observer.current.observe(node)
            }

        },[loading,hasMore,fetchOlderMessages,page]
    )

    useEffect(()=>{
        return ()=>{
            if(observer.current){
                observer.current.disconnect();
            }
        }
    },[])

    useEffect(()=>{
        if(initialLoad && chatId){
            intialFetch()
        }
    },[initialLoad,chatId])
    return { 
        messages, 
        setMessages, 
        loading, 
        hasMore, 
        firstMessageElementRef,
        resetState
    }

}
export default useMessages;