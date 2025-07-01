"use client"
import { useState } from 'react'
import style from '../Style/createChat.module.css'
import axiosInterceptor from '../Component/Interceptor';
import baseUrl from '../baseUrl';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function CreateChat() {
  const router = useRouter();
  const {token} = useAuth();
  const [chatName, setChatName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChatNameChange = (e) => {
    setChatName(e.target.value);
  };

  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };

  const handleCreateChat = async () => {
    try {
      // Using encodeURIComponent for safe URL parameter encoding
      const response = await axiosInterceptor.post(
        `${baseUrl}/api/chats?phoneNumber=${encodeURIComponent(phoneNumber)}&chatName=${encodeURIComponent(chatName)}`,
        {}, // Empty body since we're using query params
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Chat created successfully:', response.data);
      
      // Navigate to the chat or chat list page after successful creation
      router.push('/chat');
    } catch (error) {
      console.error('Error creating chat:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to create chat. Please try again.');
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
          <label htmlFor="chatname" className={style.Label}>Name</label>
          <input
            type="text"
            name="chatname"
            id="chatname"
            placeholder="Enter name"
            className={style.inputForm}
            onChange={handleChatNameChange}
            value={chatName}
            
          />
        </div>
        <div className={style.FormGroup}>
          <label htmlFor="phoneNumber" className={style.Label}>Phone Number</label>
          <input
            type="tel"
            name="phoneNumber"
            id="phoneNumber"
            placeholder="Enter phone number"
            className={style.inputForm}
            onChange={handlePhoneNumberChange}
            value={phoneNumber}
            required
          />
        </div>
        {error && <div className={style.Error}>{error}</div>}
        <div className={style.ButtonGroup}>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Chat..." : "Create Chat"}
          </button>
        </div>
      </form>
    </div>
  );
}