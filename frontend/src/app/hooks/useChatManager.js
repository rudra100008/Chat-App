
import { useRouter } from "next/navigation"
import { useCallback, useState } from "react"
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { useChatDetailsContext } from "../context/ChatDetailContext";

/**
 * useChatManager - Manages UI state for the chat interface
 * Chat data state is managed by contexts (WebSocketContext, ChatDetailContext)
 */
export const useChatManager = () => {
    const router = useRouter();
    const { userId, logout } = useAuth();
    
    // UI state only
    const [selectedChatId, setSelectedChatId] = useState('');
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [showChatInfoBox, setShowChatInfoBox] = useState(false);
    const [selectedChatInfo, setSelectedChatInfo] = useState(null);
    
    // Get data from contexts (read-only)
    const { chatInfos = [], chatNames = {} } = useWebSocket();
    const { chats = [] } = useChatDetailsContext();

    const handleChatInfoToggle = useCallback((chatDetails) => {
        if (!chatDetails?.chatId) return;
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
    },[selectedChatInfo, chatNames])
    
    const handleSearchToggle = () => {
        setShowSearchBox(prev => !prev);
    }
    
    const onChatSelect = (selectedChatId, selectedChatName) => {
        setSelectedChatId(selectedChatId);
    } 
    
    return {
        // UI state
        selectedChatId,
        showSearchBox,
        showChatInfoBox,
        selectedChatInfo,
        
        // Setters for UI state
        setSelectedChatId,
        setShowSearchBox,
        setShowChatInfoBox,
        setSelectedChatInfo,
        
        // Data from contexts
        chatInfos,
        chatNames,
        chats,
        
        // UI handlers
        handleChatInfoToggle,
        handleSearchToggle,
        onChatSelect
    }
}