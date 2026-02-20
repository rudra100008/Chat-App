"use client";
import { useState } from "react";
import style from "../Style/createChat.module.css";
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";

export default function CreateChat() {
  const router = useRouter();
  const [chatName, setChatName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [validationError, setValidationError] = useState({
    chatName: "",
    phoneNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useNotification();
  const {userId} = useAuth();

  const handleChatNameChange = (e) => {
    setChatName(e.target.value);
    setValidationError(prev => ({...prev,chatName:''}))
  };

  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
    setValidationError(prev => ({...prev,phoneNumber:''}))
  };

  const handleCreateChat = async () => {
    try {
      const createChatDTO = {
        chatName: chatName,
        phoneNumber: phoneNumber,
        creatorId :  userId,
      };

      const response = await axiosInterceptor.post(
        `/api/chats`,
        createChatDTO,
        {},
      );

      console.log("Chat created successfully:", response.data);
      success("Chat created with " + phoneNumber);

      router.push("/chat");
    } catch (err) {
      console.error("Error creating chat:", err);

      if (err.response && err.response.status === 400) {
        setValidationError({
          phoneNumber: err.response.data.phoneNumber,
          chatName: err.response.data.chatName,
        });
      } else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        error(err.response.data.message);
      } else {
        error("Failed to create chat. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    handleCreateChat();
    console.log({ chatName, phoneNumber });
  };

  return (
    <div className={style.Container}>
      <form className={style.Form} onSubmit={handleSubmit}>
        <div className={style.FormGroup}>
          <label htmlFor="chatname" className={style.Label}>
            Name
          </label>
          <input
            type="text"
            name="chatname"
            id="chatname"
            placeholder="Enter chat name"
            className={style.inputForm}
            onChange={handleChatNameChange}
            value={chatName}
          />
           <div className={style.validationError}>{validationError.chatName}</div>
        </div>
        <div className={style.FormGroup}>
          <label htmlFor="phoneNumber" className={style.Label}>
            Phone Number
          </label>
          <input
            type="tel"
            name="phoneNumber"
            id="phoneNumber"
            placeholder="Enter phone number"
            className={style.inputForm}
            onChange={handlePhoneNumberChange}
            value={phoneNumber}
          />
          <div className={style.validationError}>{validationError.phoneNumber}</div>
        </div>
        <div className={style.ButtonGroup}>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Chat..." : "Create Chat"}
          </button>
        </div>
      </form>
    </div>
  );
}
