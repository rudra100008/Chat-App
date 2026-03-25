"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import style from "../../Style/chat.module.css";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import ChatInput from "./ChatInput";
import useMessages from "@/app/hooks/useMessage";
import useChatDetails from "@/app/hooks/useChatDetails";
import { useRouter } from "next/navigation";
import useChatWebSocket from "@/app/hooks/useChatWebSocket";
import { useAuth } from "@/app/context/AuthContext";
import axiosInterceptor from "../Interceptor";

export default function ChatContainer({
  chatId,
  userId,
  otherUserDetails,
  chatName,
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const [value, setValue] = useState("");
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const {
    messages,
    setMessages,
    loading,
    firstMessageElementRef,
    resetState,
    initialLoad,
  } = useMessages({ userId, chatId });

  const { connected, stompClient, error } = useChatWebSocket({
    userId,
    chatId,
    messages,
    setMessages,
    router,
  });
  const { userChat } = useChatDetails({ chatId, userId });
  const fileRef = useRef(null);

  const onChange = (e) => {
    setValue(e.target.value);
  };

  const handleAttachmentClick = () => {
    fileRef.current.click();
  };

 const handleAttachmentChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("senderId", userId);
  formData.append("chatId", chatId);
  formData.append("file", file);

  setIsSending(true);
  try {
    const response = await axiosInterceptor.post(`/api/attachments/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log(response.data);
  } catch (error) {
    if (error.response) {
      console.log("Backend error:", error.response.data);
    } else if (error.request) {
      alert("Upload failed: File may be larger than 25MB or server did not respond.");
      console.error("No response received:", error.message);
    } else {
      console.error("Error in setting up the request:", error.message);
    }
  } finally {
    setIsSending(false);
    e.target.value = ""; // reset file input so same file can be re-uploaded
  }
};

  useEffect(() => {
    if (chatId && chatId !== currentChatId) {
      console.log("ChatContainer: Switching to new chat:", chatId);
      setCurrentChatId(chatId);
    }
  }, [chatId, currentChatId]);

 const onSend = useCallback(() => {
  if (!value.trim() || !connected) return;

  const messageDTO = {
    senderId: userId,
    chatId: chatId,
    content: value.trim(),
  };
  const chatClient = stompClient;
  if (!chatClient?.active) return;

  setIsSending(true);
  try {
    chatClient.publish({
      destination: "/app/chat.sendMessage",
      body: JSON.stringify(messageDTO),
    });
    setValue("");
  } catch (error) {
    console.error("Failed to send message:", error);
  } finally {
    setIsSending(false);
  }
}, [value, connected, chatId, userId, stompClient]);

  if (error) {
    return <div className={style.error}>{error}</div>;
  }
  return (
    <div className={style.ChatContainer}>
      <ChatHeader
        otherUserDetails={otherUserDetails}
        chatId={chatId}
        onLogout={logout}
        chatName={chatName}
      />
      {chatId ? (
        <>
          <Message
            messages={messages}
            setMessages={setMessages}
            userId={userId}
            firstPostElementRef={firstMessageElementRef}
            userChat={userChat}
            initialLoad={initialLoad}
            loading={loading}
          />

          <ChatInput
            value={value}
            onSend={onSend}
            onChange={onChange}
            fileRef={fileRef}
            handleAttachmentChange={handleAttachmentChange}
            handleAttachmentClick={handleAttachmentClick}
            connected={connected}
            isSending={isSending} 
          />
        </>
      ) : (
        <>
          <div className={style.selectChatPrompt}>
            Select a chat to start messaging
          </div>
        </>
      )}
    </div>
  );
}
