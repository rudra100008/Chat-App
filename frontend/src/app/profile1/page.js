"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { fetchUserData, fetchUserImage } from "../services/userService";
import Image from "next/image";
import styles from "./profile.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faChevronRight,
  faCog,
  faPencil,
  faRightFromBracket,
  faSignOut,
  faUser,
  faX,
} from "@fortawesome/free-solid-svg-icons";
import GetUserImage from "../Component/GetUserImage";

export default function ProfilePage() {
  const { userId, logout, isLoading } = useAuth();
  const { userLastSeen, userStatus } = useWebSocket();
  const [profile, setProfile] = useState({});
  const [editProfile,setEditProfile] = useState({});
  const [userImageUrl, setUserImageUrl] = useState(null);

  const [notifStatus, setNotifStatus] = useState("Allow");
  const [showNotifDrop, setShowNotifDrop] = useState(false);
  const [showSettings, setShowSettings] = useState(true);
  const [theme, setTheme] = useState("Light");
  const [language, setLanguage] = useState("Eng");

  const [showEditButton, setShowEditButton] = useState(true);

  const [activePanel, setActivePanel] = useState("profile");

  const notifRef = useRef(null);
  const imageInputRef = useRef(null);

  const fetchCurrentUser = async () => {
    try {
      const data = await fetchUserData(logout);
      console.log("UserData: ", data);
      setProfile(data);
      setEditProfile(data);
    } catch (err) {
      console.log("Error in profile1: ", err.response?.data);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleSave = async (e) => {};

  const handleEdit = () => {
    setShowEditButton(false);
    setEditProfile(profile)
  };

  const handleCancel = () => {
    setShowEditButton(true);
    
  };

  const handleFieldChange = (field, value) => {
    setEditProfile((prev) => ({ ...prev, [field]: value }));
  };

  const formatLastSeen = (lastSeen) =>{
    return new Intl.DateTimeFormat('en-US',{
      year:'numeric',
      weekday: 'long',
      month:'long',
      day:'numeric',
      hour:'numeric',
      minute:'2-digit'
    }).format(lastSeen);
  }

  const handleEditImageClick = () =>{
    imageInputRef.current.click();
  }

  const handleImageChange = (event) =>{
    const file = event.target.files[0];
    if(!file) return;


    setUserImageUrl(URL.createObjectURL(file));

    event.target.value = "";
  }
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* LEFT COLUMN*/}
        <div className={styles.leftCol}>
          {/* Menu card */}
          <div className={styles.card}>
            {/* avatar header */}
            <div className={styles.avatarHeader}>
              <div className={styles.avatarRing}>
                <GetUserImage userId={userId} size={58} />
              </div>
              <div className={styles.avatarText}>
                <p className={styles.userName}>{profile.name}</p>
                <p className={styles.userEmail}>{profile.email}</p>
              </div>
            </div>

            <div className={styles.menuDivider} />

            {/* nav rows */}
            <ul className={styles.menuList}>
              {/* My Profile */}
              <li
                className={styles.menuItem}
                onClick={() => setActivePanel("profile")}
              >
                <span className={styles.menuIcon}>
                  <FontAwesomeIcon icon={faUser} />
                </span>
                <span className={styles.menuLabel}>My Profile</span>
                <span className={styles.menuRight}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </li>

              {/* Settings */}
              <li
                className={styles.menuItem}
                onClick={() => setShowSettings((p) => !p)}
              >
                <span className={styles.menuIcon}>
                  <FontAwesomeIcon icon={faCog} />
                </span>
                <span className={styles.menuLabel}>Settings</span>
                <span className={styles.menuRight}>
                  <FontAwesomeIcon icon={faChevronRight} />
                </span>
              </li>

              {/* Notification – has dropdown */}
              <li
                className={styles.menuItem}
                ref={notifRef}
                style={{ position: "relative" }}
              >
                <span className={styles.menuIcon}>
                  <FontAwesomeIcon icon={faBell} />
                </span>
                <span className={styles.menuLabel}>Notification</span>
                <span
                  className={styles.notifBadge}
                  onClick={() => setShowNotifDrop((p) => !p)}
                >
                  {notifStatus}
                </span>

                {showNotifDrop && (
                  <div className={styles.notifDropdown}>
                    <button
                      onClick={() => {
                        setNotifStatus("Allow");
                        setShowNotifDrop(false);
                      }}
                    >
                      Allow
                    </button>
                    <button
                      onClick={() => {
                        setNotifStatus("Mute");
                        setShowNotifDrop(false);
                      }}
                    >
                      Mute
                    </button>
                  </div>
                )}
              </li>

              {/* Log Out */}
              <li className={styles.menuItem} onClick={logout}>
                <span className={styles.menuIcon}>
                  <FontAwesomeIcon icon={faRightFromBracket} />
                </span>
                <span className={styles.menuLabel}>Log Out</span>
              </li>
            </ul>
          </div>

          {/* Settings sub-card*/}
          {showSettings && (
            <div className={styles.card}>
              <div className={styles.settingsHeader}>
                <p className={styles.settingsTitle}>Settings</p>
                <button
                  className={styles.settingsClose}
                  onClick={() => setShowSettings(false)}
                >
                  ✕
                </button>
              </div>
              <div className={styles.settingsDivider} />
              <div className={styles.settingsList}>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsRowLabel}>Theme</span>
                  <select
                    className={styles.settingsSelect}
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                  >
                    <option value="Light">Light</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>
                <div className={styles.settingsRow}>
                  <span className={styles.settingsRowLabel}>Language</span>
                  <select
                    className={styles.settingsSelect}
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="Eng">Eng</option>
                    <option value="Nep">Nep</option>
                    <option value="Hin">Hin</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN – Edit Profile card*/}
        <div className={styles.rightCol}>
          {activePanel === "profile" && (
            <div className={styles.editCard}>
              {/* close × */}
              <button
                className={styles.editClose}
                onClick={() => setActivePanel(null)}
              >
                <FontAwesomeIcon icon={faX}/>
              </button>

              {/* avatar + name/email */}
              <div className={styles.editAvatarHeader}>
                <div className={styles.editAvatarRing}>
                  <GetUserImage userId={userId} size={58} />
                  <span onClick={handleEditImageClick} className={styles.editPencil}>
                    <FontAwesomeIcon icon={faPencil} />
                  </span>

                  <input 
                  name="userImage"
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageChange}
                  />
                </div>
                <div className={styles.editAvatarText}>
                  <p className={styles.userName}>{profile.username}</p>
                  <p className={styles.userEmail}>{profile.email}</p>
                </div>
              </div>

              <div className={styles.fieldDivider} />

              {/* Username */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Username</span>
                {showEditButton ? (
                  <>
                    <p>{profile.username}</p>
                  </>
                ) : (
                  <>
                    <input
                      className={styles.fieldValueEditable}
                      value={editProfile.username}
                      onChange={(e) =>
                        handleFieldChange("name", e.target.value)
                      }
                    />
                  </>
                )}
              </div>

              <div className={styles.fieldDivider} />

              {/* Email account */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Email account</span>
                {showEditButton ? (
                  <>
                    <p>{profile.email}</p>
                  </>
                ) : (
                  <>
                    <input
                      className={styles.fieldValueEditable}
                      value={editProfile.email}
                      onChange={(e) =>
                        handleFieldChange("email", e.target.value)
                      }
                    />
                  </>
                )}
              </div>

              <div className={styles.fieldDivider} />

              {/* Mobile number */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>Mobile number</span>
                {showEditButton ? (
                  <>
                    <p>{profile.phoneNumber}</p>
                  </>
                ) : (
                  <>
                    <input
                      className={styles.fieldValueEditable}
                      placeholder="Add number"
                      value={editProfile.phoneNumber}
                      onChange={(e) =>
                        handleFieldChange("phoneNumber", e.target.value)
                      }
                      style={
                        !profile.phoneNumber
                          ? { color: "#a8b8c4", fontStyle: "italic" }
                          : {}
                      }
                    />
                  </>
                )}
              </div>

              <div className={styles.fieldDivider} />

              {/*About Yourself */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>About Yourself</span>
                {showEditButton ? (
                  <>
                    <p>{profile.about || "N/A"} </p>
                  </>
                ) : (
                  <>
                    <input
                      className={styles.fieldValueEditable}
                      value={editProfile.about || "Enter about yourself"}
                      onChange={(e) =>
                        handleFieldChange("about", e.target.value)
                      }
                    />
                  </>
                )}
              </div>

              <div className ={styles.fieldDivider} />

              {/* LastSeen */}
              <div className={styles.fieldRow}>
                <span className={styles.fieldLabel}>LastSeen</span>
                <p>{formatLastSeen(profile.lasSeen)}</p>
              </div>

              {/* Save button + Edit Button */}
              {showEditButton ? (
                <>
                  <button className={styles.editBtn} onClick={handleEdit}>
                    Edit Profile
                  </button>
                </>
              ) : (
                <>
                  <button className={styles.saveBtn} onClick={handleSave}>
                    Save Change
                  </button>

                  <button className={styles.cancelBtn} onClick={handleCancel}>
                    Cancel Change
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
