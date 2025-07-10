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
        // console.log("Message from useMessage:\n",response.data)
        const {data,totalPage} = response.data
        console.log("All Messages: ", data);
        console.log("totalPage: ",totalPage)
        setMessages(data || []);
        setTotalPage(totalPage);
        setPage(totalPage > 0 ?totalPage - 1: 0 );
        setHasMore(totalPage > 1);
        setInitialLoad(false);

        }catch(error){
            console.error("Error fetching initial Messages:\n",error.response.data)
        }finally{
            setLoading(false);
        }
    },[userId,token,chatId])

    const fetchOlderMessages= useCallback(async()=>{
        if(loading || page <= 0 || !hasMore) return ;
        setLoading(true);
        console.log("\n--------fetching Older Messages----------\n")
        try{
            const previousPage = page - 1;
            const response = await  axiosInterceptor.get(
                `${baseUrl}/api/messages/chat/${chatId}?latest=false&pageNumber=${previousPage}`,
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            })
            
            const {data} = response.data;
            if(data &&  data.length > 0){
                setMessages(prev=>{
                   const messageArray =  [...data,...prev];
                   return removeDuplicateMessage(messageArray)
                })
                 setPage(previousPage);
                if (previousPage === 0) {
                    setHasMore(false);
                }
            }else{
                setHasMore(false)
            }
        }catch(error){
            console.log("Error occured fetching older messages:\n",error.response.data)
        }finally{
            setLoading(false)
        }
    },[loading,page,chatId,token,hasMore]);

    const firstMessageElementRef = useCallback(
        (node)=>{
            if(loading || !hasMore) return;
            if(observer.current) observer.current.disconnect();

            if(typeof window !== 'undefined'){
                observer.current = new IntersectionObserver(
                    (entries)=>{
                        // const messageContent = entries[0].target.querySelector('.MessageContent');
                        // console.log("MessageContent observed:\n",messageContent);
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
    },[initialLoad,chatId,intialFetch])
    return { 
        messages, 
        setMessages, 
        loading, 
        hasMore, 
        firstMessageElementRef,
        resetState,
        initialLoad
    }

}
export default useMessages;