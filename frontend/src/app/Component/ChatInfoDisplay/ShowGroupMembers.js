"use client"
import { useAuth } from "@/app/context/AuthContext";
import style from "../../Style/chatInfoDisplay.module.css";
import { useEffect, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import GetUserImage from "../GetUserImage";
const ShowGroupMembers = ({ chatData, userStatusMap }) => {
    const { userId, token, logout } = useAuth();
    const [participantIds, setParticipantIds] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);

    const getParticipantIds = () => {
        setParticipantIds(chatData.participantIds);
    }
    const fetchParticipants = async () => {
        for (const id of participantIds) {
            try {
                const response = await axiosInterceptor.get(`${baseUrl}/api/users/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                const userData = response.data;
                setGroupMembers((prev) => {
                    // const isSame = prev.find(member => member.userId === userData.userId);
                    // if (!isSame) {
                    //     return [...prev, userData]
                    // }
                    return [...prev,userData];
                }
                )
            } catch (error) {
                console.log(error.response.data)
            }
        }
    }

    useEffect(() => {
        getParticipantIds();
    }, [userId, chatData])

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
                        console.log("ShowGroupMember: UserId\n", user.userId)
                        const statusInfo = userStatusMap[user.userId];
                        console.log("User->",user.username, "===", statusInfo);
                        return (
                            <div key={user.userId} className={style.memberCard}>
                                <div className={`${style.imageContainer} ${statusInfo?.status === 'ONLINE' ? style.online: style.offline}`} >
                                    <GetUserImage userId={user.userId} size={40} />
                                </div>
                                <div className={style.userContainer}>
                                    <span className={style.username}>{user.username}</span>
                                    <span className={style.userLastSeen}>{new Date(statusInfo?.lastSeen || user.lastSeen).toLocaleDateString(
                                    "en-us",{
                                        year:'numeric',
                                        day:'2-digit',
                                        month:'2-digit'
                                    }
                                )}</span>
                                </div>
                            </div>
                        )
                    })}
            </div>
        </div>
    );

}
export default ShowGroupMembers;