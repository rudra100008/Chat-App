"use client"
import { faClose, faEnvelope, faPhone, faUserMinus, faUserShield, faCheck, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../../Style/memberDetail.module.css";
import Portal from "../Portal";
import GetUserImage from "../GetUserImage";
import { handlePromoteUser, handleRemoveUser } from "@/app/services/memberService";
import { useAuth } from "@/app/context/AuthContext";
import { useState } from "react";

const MemberDetail = ({ user, onClose, checkChatAdmin, chatData, setChatData }) => {
    const { userId, logout } = useAuth();
    const isLoggedInUserAdmin = chatData?.adminIds?.includes(userId);
    const isSelectedUserAdmin = checkChatAdmin(user);
    const isOwnProfile = user.userId === userId;

    const [isRemoving, setIsRemoving] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);
    const [promoteSuccess, setPromoteSuccess] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [actionError, setActionError] = useState("");

    const handleRemove = async () => {
        setIsRemoving(true);
        setActionError("");
        try {
            const updatedChatData = await handleRemoveUser(logout, user, chatData);
            if (updatedChatData) {
                setChatData(prev => ({
                    ...prev,
                    participantIds: updatedChatData.participantIds,
                    adminIds: updatedChatData.adminIds
                }));
                onClose();
            } else {
                setActionError("Failed to remove user. Please try again.");
            }
        } catch {
            setActionError("Something went wrong.");
        } finally {
            setIsRemoving(false);
            setShowRemoveConfirm(false);
        }
    };

    const handlePromote = async () => {
        setIsPromoting(true);
        setActionError("");
        try {
            const updatedChatData = await handlePromoteUser(logout, user, chatData);
            if (updatedChatData) {
                setChatData(prev =>
                    prev.chatId === updatedChatData.chatId ? updatedChatData : prev
                );
                setPromoteSuccess(true);
                setTimeout(() => setPromoteSuccess(false), 2500);
            } else {
                setActionError("Failed to promote user. Please try again.");
            }
        } catch {
            setActionError("Something went wrong.");
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <Portal>
            <div className={style.memberOverlay} onClick={onClose}>
                <div className={style.memberContainer} onClick={e => e.stopPropagation()}>

                    <button className={style.closeButton} onClick={onClose} aria-label="Close">
                        <FontAwesomeIcon icon={faClose} />
                    </button>

                    <div className={style.image}>
                        <GetUserImage userId={user.userId} size={130} />
                    </div>

                    <div className={style.userInfo}>
                        <p className={style.username}>{user.username}</p>
                        {isSelectedUserAdmin && (
                            <p className={style.adminLabel}>
                                <FontAwesomeIcon icon={faUserShield} style={{ marginRight: 4 }} />
                                Admin
                            </p>
                        )}
                    </div>

                    <div className={style.userInfoDisplay}>
                        <FontAwesomeIcon icon={faPhone} />
                        <p>{user?.phoneNumber || "—"}</p>
                    </div>
                    <div className={style.userInfoDisplay}>
                        <FontAwesomeIcon icon={faEnvelope} />
                        <p>{user?.email || "—"}</p>
                    </div>

                    {/* Error message */}
                    {actionError && (
                        <p className={style.errorText}>{actionError}</p>
                    )}

                    {isLoggedInUserAdmin && !isOwnProfile && (
                        <>
                            {/* Promote button */}
                            {!isSelectedUserAdmin && (
                                <button
                                    className={`${style.buttonGroup} ${promoteSuccess ? style.successButton : style.promoteButton}`}
                                    onClick={handlePromote}
                                    disabled={isPromoting || promoteSuccess}
                                >
                                    {isPromoting ? (
                                        <>
                                            <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: 8 }} />
                                            Promoting...
                                        </>
                                    ) : promoteSuccess ? (
                                        <>
                                            <FontAwesomeIcon icon={faCheck} style={{ marginRight: 8 }} />
                                            Promoted!
                                        </>
                                    ) : (
                                        <>
                                            <FontAwesomeIcon icon={faUserShield} style={{ marginRight: 8 }} />
                                            Promote {user.username}
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Remove button — shows confirm step */}
                            {!showRemoveConfirm ? (
                                <button
                                    className={`${style.buttonGroup} ${style.removeButton}`}
                                    onClick={() => setShowRemoveConfirm(true)}
                                    disabled={isRemoving}
                                >
                                    <FontAwesomeIcon icon={faUserMinus} style={{ marginRight: 8 }} />
                                    Remove {user.username}
                                </button>
                            ) : (
                                <div className={style.confirmInline}>
                                    <p className={style.confirmText}>
                                        Remove <strong>{user.username}</strong> from the group?
                                    </p>
                                    <div className={style.confirmActions}>
                                        <button
                                            className={`${style.confirmBtn} ${style.confirmYes}`}
                                            onClick={handleRemove}
                                            disabled={isRemoving}
                                        >
                                            {isRemoving ? (
                                                <FontAwesomeIcon icon={faSpinner} spin />
                                            ) : "Yes, Remove"}
                                        </button>
                                        <button
                                            className={`${style.confirmBtn} ${style.confirmNo}`}
                                            onClick={() => setShowRemoveConfirm(false)}
                                            disabled={isRemoving}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Portal>
    );
};

export default MemberDetail;