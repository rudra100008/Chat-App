"use client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import style from "../Style/chatInfoDisplay.module.css"
import {
  faClose, faBell, faBellSlash, faSearch,
  faUserPlus, faImage, faFileAlt, faLink,
  faPhotoVideo
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import axiosInterceptor from "./Interceptor";
import { useWebSocket } from "../context/WebSocketContext";
import SingleChat from "./ChatInfoDisplay/SingleChat";
import GroupChat from "./ChatInfoDisplay/GroupChat";
import ShowGroupMembers from "./ChatInfoDisplay/ShowGroupMembers";


const ChatInfoDisplay = ({
  userId,
  chatData,
  setChatData,
  onClose,
  lastSeen,
  status,
  userStatusMap,
  setUserStatusMap,
  loadUserChats
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [otherUserData, setOtherUserData] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { stompClientRef } = useWebSocket();

  const otherUserId = (chat) => chat.participantIds.find(pId => pId !== userId);

  const tabs = [
    { key: "overview", label: "Overview",  icon: "👤" },
    { key: "media",    label: "Media",     icon: "🖼️" },
  ];

  if (chatData.chatType === "GROUP") {
    tabs.push({ key: "members", label: "Members", icon: "👥" });
  }

  const fetchOtherUser = async () => {
    const otherId = chatData.participantIds.find(pId => pId !== userId);
    try {
      const response = await axiosInterceptor.get(`/api/users/${otherId}`)
      setUserStatusMap(prev => ({
        ...prev,
        [otherId]: {
          lastSeen: response.data.lastSeen,
          status: response.data.status
        }
      }))
      setOtherUserData(response.data);
    } catch (error) {
      console.log(error?.response?.data);
    }
  }

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return;
    const lastSeenDate = new Date(lastSeen);
    const today = new Date();
    const isSame = lastSeenDate.toDateString() === today.toDateString();
    if (isSame) {
      return lastSeenDate.toLocaleTimeString("en-us", {
        hour: "2-digit", minute: "2-digit", hour12: true
      });
    }
    return lastSeenDate.toLocaleDateString("en-us", {
      day: "2-digit", month: "long", year: "numeric"
    });
  }

  // Animated close handler
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 240);
  };

  useEffect(() => {
    if (chatData.chatType !== "SINGLE") return;
    fetchOtherUser();
  }, [chatData, userId]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    /* Backdrop click closes modal */
    <div className={style.backdrop} onClick={handleClose}>
      <div
        className={`${style.chatInfoContainer} ${isClosing ? style.closing : ""}`}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Left tab nav ── */}
        <div className={style.leftContainer}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? style.activeTabBtn : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className={style.tabIcon}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Right content ── */}
        <div className={style.rightContainer}>
          {/* Close button */}
          <button className={style.closeButton} onClick={handleClose} aria-label="Close">
            <FontAwesomeIcon icon={faClose} />
          </button>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className={style.tabContent}>
              {chatData.chatType === "SINGLE" ? (
                <SingleChat
                  otherUserId={otherUserId}
                  otherUserData={otherUserData}
                  lastSeen={lastSeen}
                  status={status}
                  formatLastSeen={formatLastSeen}
                  chatData={chatData}
                  setChatData={setChatData}
                  loadUserChats={loadUserChats}
                />
              ) : (
                <GroupChat
                  chatData={chatData}
                  setChatData={setChatData}
                  loadUserChats={loadUserChats}
                  onClose={handleClose}
                />
              )}

              {/* Quick-action buttons row */}
              <div className={style.actionRow}>
                <button
                  className={`${style.actionBtn} ${isMuted ? style.active : ""}`}
                  onClick={() => setIsMuted(p => !p)}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  <FontAwesomeIcon icon={isMuted ? faBellSlash : faBell} />
                  {isMuted ? "Unmuted" : "Mute"}
                </button>

                {chatData.chatType === "GROUP" && (
                  <button
                    className={style.actionBtn}
                    onClick={() => setActiveTab("members")}
                    title="Add Member"
                  >
                    <FontAwesomeIcon icon={faUserPlus} />
                    Add
                  </button>
                )}

                <button
                  className={`${style.actionBtn} ${style.danger}`}
                  title="Search in chat"
                >
                  <FontAwesomeIcon icon={faSearch} />
                  Search
                </button>
              </div>
            </div>
          )}

          {/* Media tab */}
          {activeTab === "media" && (
            <div className={style.tabContent}>
              <p className={style.sectionTitle}>
                <FontAwesomeIcon icon={faPhotoVideo} style={{ marginRight: 4 }} />
                Shared Media
              </p>
              <MediaTab chatId={chatData.chatId} />
            </div>
          )}

          {/* Members tab */}
          {chatData.chatType === "GROUP" && activeTab === "members" && (
            <div className={style.tabContent}>
              <ShowGroupMembers
                chatData={chatData}
                setChatData={setChatData}
                userStatusMap={userStatusMap}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


/* ── Media tab sub-component ── */
const MediaTab = ({ chatId }) => {
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await axiosInterceptor.get(`/api/attachments/chat/${chatId}`);
        setMediaFiles(res.data || []);
      } catch {
        setMediaFiles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [chatId]);

  if (loading) {
    return (
      <div className={style.mediaEmpty}>
        <FontAwesomeIcon icon={faImage} />
        <span>Loading media…</span>
      </div>
    );
  }

  if (!mediaFiles.length) {
    return (
      <div className={style.mediaEmpty}>
        <FontAwesomeIcon icon={faImage} />
        <span>No shared media yet</span>
      </div>
    );
  }

  // Split by type
  const images = mediaFiles.filter(f => f.fileType?.startsWith("image/"));
  const files  = mediaFiles.filter(f => !f.fileType?.startsWith("image/"));

  return (
    <>
      {images.length > 0 && (
        <>
          <p className={style.sectionTitle}>
            <FontAwesomeIcon icon={faImage} style={{ marginRight: 4 }} />
            Photos &amp; Videos
          </p>
          <div className={style.mediaGrid}>
            {images.map((file, i) => (
              <a
                key={i}
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={style.mediaItem}
              >
                <img
                  src={file.fileUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </a>
            ))}
          </div>
        </>
      )}

      {files.length > 0 && (
        <>
          <p className={style.sectionTitle} style={{ marginTop: "1rem" }}>
            <FontAwesomeIcon icon={faFileAlt} style={{ marginRight: 4 }} />
            Files
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {files.map((file, i) => (
              <a
                key={i}
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={style.chatInfoDisplay}
                style={{ textDecoration: "none" }}
              >
                <FontAwesomeIcon
                  icon={file.fileType?.includes("pdf") ? faFileAlt : faLink}
                  className={style.iconStyle}
                />
                <div className={style.chatInfo}>
                  <p>File</p>
                  <p style={{ wordBreak: "break-all" }}>
                    {file.fileName || "Attachment"}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </>
  );
};


export default ChatInfoDisplay;