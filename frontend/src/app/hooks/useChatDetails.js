// hooks/useChatDetails.js
"use client"
import { useState, useEffect, useCallback } from 'react'
import axiosInterceptor from '../Component/Interceptor'
import baseUrl from '../baseUrl'
import { fetchChatDetailService } from '../services/chatServices'

/**
 * useChatDetails - Manages individual chat and user details fetching
 * @param {string} chatId - The chat ID to fetch details for
 * @param {string} userId - Current user ID
 * @returns {Object} Chat details and user details
 */
const useChatDetails = ({ chatId, userId }) => {
    const [userChat, setUserChat] = useState({
        chatId: "",
        chatName: "",
        chatType: "",
        participantIds: [],
        messageIds: []
    })
    const [otherUserDetails, setOtherUserDetails] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Fetch chat details
    const fetchUserChatDetails = useCallback(async () => {
        if (!chatId) return
        setLoading(true)
        try {
            const data = await fetchChatDetailService(chatId)
            setUserChat(data)
            setError(null)
        } catch (err) {
            console.log("Error fetching chat details:", err.response?.data)
            setError(err.response?.data?.message || "Failed to fetch chat details")
        } finally {
            setLoading(false)
        }
    }, [chatId])

    // Get other user ID (for 1-1 chats)
    const getOtherUserId = useCallback(() => {
        if (!userChat.participantIds || userChat.participantIds.length === 0) {
            return null
        }
        
        if (userChat.chatType === 'GROUP') {
            return null
        }
        
        return userChat.participantIds.find(pId => pId !== userId)
    }, [userChat.participantIds, userChat.chatType, userId])

    // Fetch other user details
    const fetchUserDetails = useCallback(async () => {
        const otherUserId = getOtherUserId()
        if (!otherUserId) {
            setOtherUserDetails(null)
            return
        }
       
        try {
            const response = await axiosInterceptor.get(
                `${baseUrl}/api/users/${otherUserId}`
            )
            setOtherUserDetails(response.data)
            setError(null)
        } catch (err) {
            console.log("Error fetching user details:", err.response?.data)
            setError(err.response?.data?.message || "Failed to fetch user details")
        }
    }, [getOtherUserId])

    // Fetch chat details when chatId changes
    useEffect(() => {
        fetchUserChatDetails()
    }, [chatId, fetchUserChatDetails])

    // Fetch user details when chat details change
    useEffect(() => {
        if (userChat.chatId) {
            fetchUserDetails()
        }
    }, [userChat.chatId, fetchUserDetails])

    return { 
        userChat: userChat || {},
        otherUserDetails: otherUserDetails || null,
        loading,
        error,
        getOtherUserId
    }
}

export default useChatDetails