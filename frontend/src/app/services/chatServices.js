// services/chatService.js
import baseUrl from "../baseUrl";
import axiosInterceptor from "../Component/Interceptor";


export const fetchChatNames = async (chats, userId) => {
    const chatNames = {};

    for (const chat of chats) {
        if (chat.chatType == "SINGLE") {
            try {
                const response = await axiosInterceptor.get(
                    `/api/chatName/fetchChatName/${userId}/chat/${chat.chatId}`
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


export const fetchUserChats = async (userId,logout) => {
    if (!userId ) {
        throw new Error("User ID is required");
    }

    try {
        const response = await axiosInterceptor.get(
            `/api/chats/user/${userId}`
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

export const fetchUserChatsWithNames = async (userId,router,logout) => {
    try {
        const chats = await fetchUserChats(userId,logout);
        const chatNames = await fetchChatNames(chats, userId);

        return {
            chats,
            chatNames
        };
    } catch (error) {
        throw error;
    }
};

export const deleteGroupChat = async(chatId)=>{
    try{
        const response = await axiosInterceptor.delete(`/api/chats/groupChat/${chatId}`);
        return response.data;
    }catch(err){
        console.log("Error responsein chatService: ",err.response.data)
        throw err;
    }
}