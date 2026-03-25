"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/chatInput.module.css'
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/app/context/AuthContext';

const ChatInput = ({ value, onSend, onChange, fileRef, handleAttachmentChange, handleAttachmentClick, connected, isSending }) => {
  return (
    <div className={style.inputWrapper}>

      <div className={style.FieldGroup}>
        <FontAwesomeIcon
          className={`${style.faPaperclip} ${isSending ? style.faPaperclipDisabled : ""}`}
          onClick={isSending ? undefined : handleAttachmentClick}  // block click while sending
          icon={faPaperclip}
        />
        <input
          type='file'
          ref={fileRef}
          style={{ display: "none" }}
          accept=".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.svg,.mp3,.wav,.aac,.flac,.mp4,.avi,.mkv,.mov,.wmv"
          onChange={handleAttachmentChange}
          disabled={isSending}
        />
      </div>

      <div className={style.FieldGroup}>
        <input
          type="text"
          name='content'
          id='content'
          placeholder={isSending ? "Sending..." : "Type a message"}  // ← placeholder feedback
          className={style.FieldInput}
          value={value}
          onChange={onChange}
          onKeyPress={(e) => e.key === "Enter" && !isSending && onSend()}
          disabled={isSending}
        />
      </div>

      <div className={style.ButtonGroup}>
        <button
          className={style.SendButton}
          onClick={onSend}
          disabled={!connected || isSending}
        >
          {isSending ? "Sending..." : "Send"}  {/* ← button text feedback */}
        </button>
      </div>

    </div>
  );
};

export default ChatInput;