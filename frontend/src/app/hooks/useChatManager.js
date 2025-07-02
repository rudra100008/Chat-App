
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useWebSocket } from "../context/WebSocketContext";
import { fetchUserChatsWithNames } from "../services/chatServices";
import { useAuth } from "../context/AuthContext";


export const useChatManager = () => {
    const router = useRouter();
    const [isChatInfosLoading, setIsChatInfosLoading] = useState(true);
    const { userId, token, logout } = useAuth();
    const [chatId,setChatId] = useState('');
    const [chatNames, setChatNames] = useState({});
    const [chatName,setChatName] = useState('');
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [showChatInfoBox, setShowChatInfoBox] = useState(false);
    const [selectedChatInfo, setSelectedChatInfo] = useState(null);
    const { setChatInfos, chatInfos } = useWebSocket();


    const loadUserChats = useCallback(async () => {
        if (!userId || !token) return;
        setIsChatInfosLoading(true);
        try {
            const { chats, chatNames } = await fetchUserChatsWithNames(userId, token, router, logout);
            setChatNames(chatNames);
            setChatInfos(chats);
        } catch (error) {
            console.log("UseChatManager: ", error.response.data);
            if (error.response && error.response.status === 403) {
                logout();
            } else {
                console.log("UseChatManager: ", error.response.data);
            }
        }finally{
            setIsChatInfosLoading(false);
        }
    }, [userId, token, router, logout, setChatInfos])


    const handleChatInfoToggle = useCallback((chatDetails) => {
        const isSame = selectedChatInfo?.chatId === chatDetails.chatId;
        if(isSame){
            setSelectedChatInfo(null);
            setShowChatInfoBox(false);
        }else{
            setShowChatInfoBox(true);
            setSelectedChatInfo({
                ...chatDetails,
                chatName : chatNames[chatDetails.chatId]
            })
        }
    })
    const handleSearchToggle = () => {
        setShowSearchBox(prev => !prev);
    }
    const onChatSelect = (selectedChatId,selectedChatName) => {
        setChatId(selectedChatId);
        setChatName(selectedChatName);
    } 
    return{
        chatId,
        chatName,
        chatNames,
        chatInfos,
        showSearchBox,
        showChatInfoBox,
        selectedChatInfo,
        isChatInfosLoading,
       

        setChatId,
        setChatName,
        setChatNames,
        setChatInfos,
        setShowSearchBox,
        setShowChatInfoBox,
        setSelectedChatInfo,
        setIsChatInfosLoading,

        loadUserChats,
        handleChatInfoToggle,
        handleSearchToggle,
        onChatSelect
    }
}