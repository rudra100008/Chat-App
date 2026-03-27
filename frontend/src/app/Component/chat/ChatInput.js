"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/chatInput.module.css'
import { faPaperclip, faPaperPlane, faFaceSmile } from '@fortawesome/free-solid-svg-icons';
import { useRef, useEffect } from 'react';

const ChatInput = ({ value, onSend, onChange, fileRef, handleAttachmentChange, handleAttachmentClick, connected, isSending }) => {
  const textareaRef = useRef(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px"; // max 5 lines
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isSending) {
      e.preventDefault();
      onSend();
    }
    // Shift+Enter = new line (default textarea behavior)
  };

  const hasContent = value.trim().length > 0;

  return (
    <div className={style.inputWrapper}>
      {/* Hidden file input */}
      <input
        type='file'
        ref={fileRef}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.txt,.rtf,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.svg,.mp3,.wav,.aac,.flac,.mp4,.avi,.mkv,.mov,.wmv"
        onChange={handleAttachmentChange}
        disabled={isSending}
      />

      {/* Input row */}
      <div className={style.inputRow}>
        {/* Attachment button */}
        <button
          className={`${style.iconBtn} ${isSending ? style.iconBtnDisabled : ""}`}
          onClick={isSending ? undefined : handleAttachmentClick}
          title="Attach file"
          type="button"
          disabled={isSending}
        >
          <FontAwesomeIcon icon={faPaperclip} />
        </button>

        {/* Textarea */}
        <div className={style.textareaWrap}>
          <textarea
            ref={textareaRef}
            name='content'
            placeholder="Type a message... (Shift+Enter for new line)"
            className={style.textarea}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            rows={1}
          />
        </div>

        {/* Send button — icon only, turns active when there's content */}
        <button
          className={`${style.sendBtn} ${hasContent && connected ? style.sendBtnActive : ""}`}
          onClick={onSend}
          disabled={!connected || isSending || !hasContent}
          title="Send message"
          type="button"
        >
          {isSending ? (
            <span className={style.sendingDots}>
              <span /><span /><span />
            </span>
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
        </button>
      </div>

      {/* Hint text */}
      <div className={style.inputHint}>
        {!connected
          ? <span className={style.hintDisconnected}>● Reconnecting...</span>
          : <span className={style.hintText}>Enter to send · Shift+Enter for new line</span>
        }
      </div>
    </div>
  );
};

export default ChatInput;