// services/chatService.js


import baseUrl from "../baseUrl";
import axiosInterceptor from "../Component/Interceptor";

/**
 * Fetches chat names for an array of chats
 * @param {Array} chats - Array of chat objects
 * @param {string} userId - Current user ID
 * @param {string} token - Authorization token
 * @returns {Object} Object with chatId as key and chatname as value
 */
export const fetchChatNames = async (chats, userId, token) => {
    const chatNames = {};

    for (const chat of chats) {
        try {
            const response = await axiosInterceptor.get(
                `${baseUrl}/api/chatName/fetchChatName/${userId}/chat/${chat.chatId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            chatNames[chat.chatId] = response.data.chatname;
        } catch (error) {
            console.log("Error in ChatName:\n", error.response?.message || error.message);
            if(chat.chatType === "GROUP"){
                chatNames[chat.chatId] =  chat.chatName;
            }else{
            chatNames[chat.chatId] = "Unknown chat";
            }
        }
    }
    return chatNames;
};

/**
 * Fetches all chats for a specific user
 * @param {string} userId - User ID
 * @param {string} token - Authorization token
 * @returns {Array} Array of chat objects
 */
export const fetchUserChats = async (userId, token) => {
    if (!userId || !token) {
        throw new Error("User ID and token are required");
    }

    try {
        const response = await axiosInterceptor.get(
            `${baseUrl}/api/chats/user/${userId}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        console.log('Response of userChats:', response.data);
        return response.data;
    } catch (error) {
        console.log("Error from fetchUserChats:", error.response?.data || error.message);
        throw error; // Re-throw to let the component handle it
    }
};

/**
 * Fetches user chats along with their names
 * @param {string} userId - User ID
 * @param {string} token - Authorization token
 * @returns {Object} Object containing chats array and chatNames object
 */
export const fetchUserChatsWithNames = async (userId, token) => {
    try {
        const chats = await fetchUserChats(userId, token);
        const chatNames = await fetchChatNames(chats, userId, token);
        
        return {
            chats,
            chatNames
        };
    } catch (error) {
        throw error;
    }
};