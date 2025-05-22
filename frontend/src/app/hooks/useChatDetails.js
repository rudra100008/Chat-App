// hooks/useChatDetails.js
"use client"
import { useState, useEffect } from 'react'
import axiosInterceptor from '../Component/Interceptor'
import baseUrl from '../baseUrl'

const useChatDetails = ({chatId, token, userId, setOtherUserDetails}) => {
    const [userChat, setUserChat] = useState({
        chatId: "",
        chatName: "",
        chatType: "",
        participantIds: [],
        messageIds: []
    })

    // Fetch chat details
    const fetchUserChatDetails = async () => {
        if (!chatId || !token) return
        try {
            const response = await axiosInterceptor.get(
                `${baseUrl}/api/chats/chatDetails/${chatId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )
            setUserChat(response.data)
        } catch (error) {
            console.log("Error fetching chat details:", error.response?.data)
        }
    }

    // Get other user ID (for 1-1 chats)
    const getOtherUserId = () => {
        if (!userChat.participantIds || userChat.participantIds.length === 0) {
            return null
        }
        
        if (userChat.chatType === 'GROUP') {
            return null
        }
        
        return userChat.participantIds.find(pId => pId !== userId)
    }

    // Fetch other user details
    const fetchUserDetails = async () => {
        const otherUserId = getOtherUserId()
        if (!otherUserId) return
       
        try {
            const response = await axiosInterceptor.get(
                `${baseUrl}/api/users/${otherUserId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )
            setOtherUserDetails(response.data)
        } catch (error) {
            console.log("Error fetching user details:", error.response?.data)
        }
    }

    // Fetch chat details when chatId changes
    useEffect(() => {
        if (!chatId) return
        fetchUserChatDetails()
    }, [chatId, token, userId])

    // Fetch user details when chat details change
    useEffect(() => {
        if (userChat.chatId) {
            fetchUserDetails()
        }
    }, [userChat])

    return { userChat }
}

export default useChatDetails