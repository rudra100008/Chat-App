"use client";
import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCheck, faCheckDouble,
    faPencil, faTrash, faXmark, faFloppyDisk,
} from "@fortawesome/free-solid-svg-icons";

import style from "../Style/chat.module.css";
import bubbleStyle from "../Style/messageBubble.module.css";
import { editMessageService, deleteMessageService } from "@/app/services/messageService";
import AttachmentDisplay from "./chat/AttachmentDisplay";

const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString("en-us", {
        hour: "2-digit", minute: "2-digit", hour12: true,
    });

/**
 * MessageBubble
 * Drop-in replacement for the inline bubble markup in Single/GroupChatMessage.
 * Props:
 *   msg         – MessageDTO
 *   isSent      – boolean (current user is sender)
 *   userId      – current user's id
 *   setMessages – state setter from Message.js (to update local state)
 *   children    – optional sender name label (group chats)
 */
const MessageBubble = ({ msg, isSent, userId, setMessages, isLastInGroup, isGrouped, children }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(msg.content || "");
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const inputRef = useRef(null);

    // ── Edit ────────────────────────────────────────────────────────────────
    const handleEditStart = () => {
        setEditValue(msg.content || "");
        setIsEditing(true);
        // Focus the textarea on next tick after render
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const handleEditCancel = () => {
        setIsEditing(false);
        setEditValue(msg.content || "");
    };

    const handleEditSave = async () => {
        const trimmed = editValue.trim();
        if (!trimmed || trimmed === msg.content) {
            setIsEditing(false);
            return;
        }
        setIsSaving(true);
        try {
            const updated = await editMessageService(msg.messageId, trimmed);
            // Optimistically update local state — WebSocket will also arrive
            // and useChatWebSocket deduplicates by messageId, so it's fine.
            setMessages(prev =>
                prev.map(m => m.messageId === updated.messageId ? updated : m)
            );
            setIsEditing(false);
        } catch {
            // Keep editing mode open so the user can retry
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleEditSave();
        }
        if (e.key === "Escape") handleEditCancel();
    };

    // ── Delete ───────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            await deleteMessageService(msg.messageId, msg.chatId);
            // Optimistically remove — WebSocket tombstone also arrives and is handled
            // in useChatWebSocket via the eventType === "DELETED" check.
            setMessages(prev => prev.filter(m => m.messageId !== msg.messageId));
        } catch {
            setShowConfirmDelete(false);
        } finally {
            setIsDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    const isAttachment = !msg.content || msg.content === "";

    return (
        <div className={`${bubbleStyle.bubbleWrap} ${isSent ? bubbleStyle.sent : bubbleStyle.received}`}>

            {/* ── Hover action toolbar (only for sender's messages, only text) ── */}
            {isSent && !isAttachment && (
                <div className={bubbleStyle.actionBar}>
                    <button
                        className={bubbleStyle.actionBtn}
                        onClick={handleEditStart}
                        title="Edit"
                        disabled={isEditing}
                    >
                        <FontAwesomeIcon icon={faPencil} />
                    </button>
                    <button
                        className={`${bubbleStyle.actionBtn} ${bubbleStyle.danger}`}
                        onClick={() => setShowConfirmDelete(true)}
                        title="Delete"
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>
            )}

            {/* ── Bubble ── */}
            <div
                className={`
                    ${style.Message}
                    ${isSent ? style.SentMessage : style.ReceivedMessage}
                    ${isLastInGroup ? style.lastInGroup : style.groupedBubble}
                `}
            >
                {/* Sender name (group chats, injected as children) */}
                {children}

                {/* Content or attachment */}
                {isEditing ? (
                    <div className={bubbleStyle.editArea}>
                        <textarea
                            ref={inputRef}
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={handleEditKeyDown}
                            className={bubbleStyle.editInput}
                            rows={Math.min(6, editValue.split("\n").length || 1)}
                        />
                        <div className={bubbleStyle.editActions}>
                            <button
                                className={bubbleStyle.editSave}
                                onClick={handleEditSave}
                                disabled={isSaving}
                                title="Save (Enter)"
                            >
                                <FontAwesomeIcon icon={faFloppyDisk} />
                                {isSaving ? "Saving…" : "Save"}
                            </button>
                            <button
                                className={bubbleStyle.editCancel}
                                onClick={handleEditCancel}
                                title="Cancel (Esc)"
                            >
                                <FontAwesomeIcon icon={faXmark} />
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : isAttachment ? (
                    <AttachmentDisplay message={msg} />
                ) : (
                    <div className={style.MessageContent}>
                        {msg.content}
                        {msg.edited && (
                            <span className={bubbleStyle.editedLabel}> · edited</span>
                        )}
                    </div>
                )}

                {/* Timestamp + read receipt */}
                {!isEditing && (
                    <div className={style.MessageFooter}>
                        <span className={style.MessageTimestamp}>{formatTime(msg.timestamp)}</span>
                        {isSent && (
                            <span className={`${style.ReadReceipt} ${msg.read ? style.read : ""}`}>
                                <FontAwesomeIcon icon={msg.read ? faCheckDouble : faCheck} />
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* ── Inline confirm delete ── */}
            {showConfirmDelete && (
                <div className={`${bubbleStyle.confirmDelete} ${isSent ? bubbleStyle.confirmSent : bubbleStyle.confirmReceived}`}>
                    <span className={bubbleStyle.confirmText}>Delete this message?</span>
                    <button
                        className={bubbleStyle.confirmYes}
                        onClick={handleDeleteConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "…" : "Delete"}
                    </button>
                    <button
                        className={bubbleStyle.confirmNo}
                        onClick={() => setShowConfirmDelete(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default MessageBubble;