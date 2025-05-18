"use client"
import { useState } from 'react'
import style from '../Style/createChat.module.css'

export default function CreateChat() {
  const [chatName, setChatName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleChatNameChange = (e) => {
    setChatName(e.target.value);
  };

  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add your submission logic here
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
          />
        </div>
        <div className={style.ButtonGroup}>
          <button type="submit">Create Chat</button>
        </div>
      </form>
    </div>
  );
}
