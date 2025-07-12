"use client"
import { useAuth } from "@/app/context/AuthContext";
import style from "../../Style/chatInfoDisplay.module.css";
import { useCallback, useEffect, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import GetUserImage from "../GetUserImage";
import MemberDetail from "./MemberDetail";
const ShowGroupMembers = ({ chatData, setChatData, userStatusMap }) => {
    const { userId, token, logout } = useAuth();
    const [groupMembers, setGroupMembers] = useState([]);
    const [showMember, setShowMember] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);


   const checkChatAdmin = useCallback((user) => chatData?.adminIds?.includes(user.userId), [chatData?.adminIds])


    const fetchParticipants = async () => {
        try {
            const requests = chatData?.participantIds.map((pId) =>
                axiosInterceptor.get(`${baseUrl}/api/users/${pId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
            )

            const response = await Promise.all(requests);
            // in here using Array.filter but it performance is good compared to set show i am using set below
            // const uniqueMember = response.map(res => res.data)
            //     .filter((user, index, self) => index === self.findIndex(u => u.userId === user.userId));
            //  setGroupMembers(uniqueMember);   

            const membersData = response.map(res => res.data);
            const seen = new Set();
            const uniqueMembers = [];

            for (const user of membersData) {
                if (!seen.has(user.userId)) {
                    seen.add(user.userId);
                    uniqueMembers.push(user);
                }
            }
            setGroupMembers(uniqueMembers);

        } catch (error) {
            console.error("Failed to fetch participants:", error.response?.data || error.message);
            if (error.response?.status === 401) {
                logout(); // Handle expired tokens
            }
        }
    }
    const onClose = () => {
        setShowMember(false);
        setSelectedUser(null);
    }

    useEffect(() => {
        if (!userId || !token) return;
        if (chatData) {
            fetchParticipants();
        }
    }, [chatData?.participantIds, token,userId])
    return (
        <div className={style.groupContainer}>
            <h3 className={style.title}>Participants ({chatData.participantIds.length})</h3>
            <div className={style.membersList}>
                {groupMembers.length > 0 &&
                    groupMembers.map((user) => {
                        const statusInfo = userStatusMap[user.userId];
                        // console.log("User->", user.username, "===", statusInfo);
                        return (
                            <div
                                key={user.userId}
                                className={style.memberCard}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUser(user);
                                    setShowMember(true);
                                }}
                            >
                                <div
                                    className={`${style.imageContainer} ${statusInfo?.status === 'ONLINE' ? style.online : style.offline}`}
                                >
                                    <GetUserImage userId={user.userId} size={40} />
                                </div>
                                <div className={style.userContainer}>

                                    <div className={style.nameSection}>
                                        <span className={style.username}>{user.username}</span>
                                        {checkChatAdmin(user) && (
                                            <span className={style.adminLabel}>Admin</span>
                                        )}
                                    </div>
                                    <span className={style.userLastSeen}>
                                        {new Date(statusInfo?.lastSeen || user.lastSeen).toLocaleDateString(
                                            "en-us",
                                            {
                                                year: "numeric",
                                                day: "2-digit",
                                                month: "2-digit",
                                            }
                                        )}
                                    </span>

                                </div>
                            </div>
                        )

                    })}
            </div>
            {
                showMember && showMember &&
                <MemberDetail
                    user={selectedUser}
                    onClose={onClose}
                    checkChatAdmin={checkChatAdmin}
                    chatData={chatData}
                    setChatData = {setChatData}
                />
            }
        </div>
    );

}
export default ShowGroupMembers;