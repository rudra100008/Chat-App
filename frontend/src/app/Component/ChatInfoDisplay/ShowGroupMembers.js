"use client"
import { useAuth } from "@/app/context/AuthContext";
import style from "../../Style/chatInfoDisplay.module.css";
import { useEffect, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import GetUserImage from "../GetUserImage";
import MemberDetail from "./MemberDetail";
const ShowGroupMembers = ({ chatData, userStatusMap }) => {
    const { userId, token, logout } = useAuth();
    const [participantIds, setParticipantIds] = useState(chatData?.participantIds);
    const [groupMembers, setGroupMembers] = useState([]);
    const [showMember, setShowMember] = useState(false);


    const checkChatAdmin = (user) => chatData.adminIds.includes(user.userId);


    const fetchParticipants = async () => {
        try {
            const requests = participantIds.map((pId) =>
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
    }
    useEffect(() => {
        if (!userId || !token) return;
        if (chatData) {
            fetchParticipants();
        }
    }, [chatData, participantIds, token])
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
                                {
                                    showMember &&

                                    <MemberDetail
                                        user={user}
                                        onClose={onClose}
                                    />
                                }

                            </div>
                        )

                    })}
            </div>
        </div>
    );

}
export default ShowGroupMembers;