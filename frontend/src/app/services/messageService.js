import axiosInterceptor from "../Component/Interceptor";


/*
 * Edits message content. The controller also broadcasts the updates using websocket
 */
export const editMessageService = async (messageId, newContent) => {
    try {
        const response = await axiosInterceptor.patch(`/api/messages/${messageId}`, {
            content: newContent,
        });
        return response.data; // MessageDTO
    } catch (err) {
        console.error("editMessageService error:", err.response?.data || err.message);
        throw err;
    }
};

/**
 * DELETE message using messageId and chatId
 */
export const deleteMessageService = async (messageId, chatId) => {
    try {
        const response = await axiosInterceptor.delete(
            `/api/messages/delete/${messageId}/chat/${chatId}`
        );
        return response.data; // { messageId, eventType: "DELETED" }
    } catch (err) {
        console.error("deleteMessageService error:", err.response?.data || err.message);
        throw err;
    }
};