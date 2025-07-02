// services/chatService.js
import baseUrl from "../baseUrl";
import axiosInterceptor from "../Component/Interceptor";


export const fetchChatNames = async (chats, userId, token) => {
    const chatNames = {};

    for (const chat of chats) {
        if (chat.chatType == "SINGLE") {
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
                if (chat.chatType === "GROUP") {
                    chatNames[chat.chatId] = chat.chatName;
                } else {
                    chatNames[chat.chatId] = "Unknown chat";
                }
            }
        } else if (chat.chatType === "GROUP") {
            chatNames[chat.chatId] = chat.chatName;
        } else {
            chatNames[chat.chatId] = "Unknown chat";
        }
    }
    return chatNames;
};


export const fetchUserChats = async (userId, token,logout) => {
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
        if(error.response.status === 401){
            logout();
        }
        throw error;
    }
};

export const fetchUserChatsWithNames = async (userId, token,router,logout) => {
    try {
        const chats = await fetchUserChats(userId, token,logout);
        const chatNames = await fetchChatNames(chats, userId, token);

        return {
            chats,
            chatNames
        };
    } catch (error) {
        throw error;
    }
};