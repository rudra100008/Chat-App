"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/chatInput.module.css'
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useRef } from 'react';
import axiosInterceptor from '../Interceptor';
import baseUrl from '@/app/baseUrl';
import { useAuth } from '@/app/context/AuthContext';

const ChatInput = ({ value, onSend, onChange, fileRef, handleAttachmentChange, handleAttachmentClick, connected }) => {
  

    
    return (
        <div className={style.inputWrapper}>
            <div className={style.FieldGroup}>
                <FontAwesomeIcon className={style.faPaperclip} onClick={handleAttachmentClick} icon={faPaperclip}/>
                <input 
                type='file'
                ref={fileRef}
                style={{display: "none"}}
                 accept=".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.svg,.mp3,.wav,.aac,.flac,.mp4,.avi,.mkv,.mov,.wmv"
                onChange={handleAttachmentChange}
                />
            </div>
            <div className={style.FieldGroup}>
                <input
                    type="text"
                    name='content'
                    id='content'
                    placeholder='Type a message'
                    className={style.FieldInput}
                    value={value}
                    onChange={onChange}
                    onKeyPress={(e) => e.key === "Enter" && onSend()}
                />
            </div>
            <div className={style.ButtonGroup}>
                <button
                    className={style.SendButton}
                    onClick={onSend}
                    disabled={!connected}
                >
                    Send
                </button>
            </div>
        </div>
    )
}

export default ChatInput;