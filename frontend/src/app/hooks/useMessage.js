"use client"
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

    const intialFetch=async()=>{
        setLoading(true);
        try{
             const response = await axiosInterceptor.get(`${baseUrl}/api/messages/chat/${chatId}?latest=true`,{
            headers:{
                Authorization:`Bearer ${token}`
            }
        })
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
    }

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
            if(data && page >=0){
                setPage(prev=>prev-1);
                setMessages(prev=>[...data,...prev])
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

    useEffect(() => {
        if (chatId && !initialLoad && hasMore && !loading && page >= 0) {
            fetchOlderMessages()
        }
    }, [chatId, initialLoad, page, hasMore, loading, fetchOlderMessages])

    return { 
        messages, 
        setMessages, 
        loading, 
        hasMore, 
        firstMessageElementRef
    }

}
export default useMessages;