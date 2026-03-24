"use client";
import { useEffect, useState } from "react";
import style from "../Style/chat.module.css";
import UserChats from "../Component/UserChats";
import ChatContainer from "../Component/chat/ChatContainer";
import { useAuth } from "../context/AuthContext";
import SearchUser from "../Component/SearchUser";
import ChatInfoDisplay from "../Component/ChatInfoDisplay";
import { useWebSocket } from "../context/WebSocketContext";
import { useChatManager } from "../hooks/useChatManager";
import useChatDetails from "../hooks/useChatDetails";
import PathGuard from "../Component/PathAuth/PathGuard";
import { useRouter } from "next/navigation";

export default function Chat() {
  const router = useRouter();
  const { userId, isLoading, isInitialized, isAuthenticated } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  if (!isInitialized || isLoading) {
    return <div className={style.loading}>Loading authentication....</div>;
  }

  if (!isAuthenticated) {
    // Redirect immediately without rendering any hooks
    router.push("/");
    return <div className={style.loading}>Redirecting to login...</div>;
  }
  // UI state and chat data from contexts
  const {
    selectedChatId,
    showSearchBox,
    showChatInfoBox,
    selectedChatInfo,
    setShowSearchBox,
    setShowChatInfoBox,
    setSelectedChatInfo,
    chatNames = {},
    handleChatInfoToggle,
    onChatSelect,
  } = useChatManager();

  // Chat and user details for selected chat
  const { userChat, otherUserDetails, getOtherUserId } = useChatDetails({
    chatId: selectedChatId,
    userId,
  });

  const { userStatusMap = {}, setUserStatusMap } = useWebSocket();

  const otherUserId = selectedChatId ? getOtherUserId() : null;

  const handleErrorMessage = (message) => {
    setErrorMessage(message);
  };

  return (
    <PathGuard>
      <div className={style.body}>
        {showSearchBox && <SearchUser onError={handleErrorMessage} />}
        {showChatInfoBox && selectedChatInfo && (
          <ChatInfoDisplay
            lastSeen={userStatusMap[otherUserId]?.lastSeen || null}
            status={userStatusMap[otherUserId]?.status || null}
            userStatusMap={userStatusMap}
            setUserStatusMap={setUserStatusMap}
            userId={userId}
            chatData={selectedChatInfo}
            setChatData={setSelectedChatInfo}
            onClose={() => setShowChatInfoBox(false)}
          />
        )}
        <div className={style.UserChat}>
          <UserChats
            onChatSelect={onChatSelect}
            chatNames={chatNames}
            handleChatInfoToggle={handleChatInfoToggle}
          />
        </div>
        <ChatContainer
          chatId={selectedChatId}
          userId={userId}
          chatName={chatNames[selectedChatId] || ""}
          otherUserDetails={otherUserDetails}
        />
      </div>
    </PathGuard>
  );
}
