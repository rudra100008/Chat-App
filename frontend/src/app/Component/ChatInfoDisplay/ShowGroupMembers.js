"use client"
import { useAuth } from "@/app/context/AuthContext";
import style from "../../Style/chatInfoDisplay.module.css";
import { useEffect, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import GetUserImage from "../GetUserImage";
const ShowGroupMembers = ({ chatData, checkOtherUserStatus, userStatusMap }) => {
    const { userId, token, logout } = useAuth();
    const [participantIds, setParticipantIds] = useState([]);
    const [groupMembers, setGroupMembers] = useState([]);

    const getParticipantIds = () => {
        setParticipantIds(chatData.participantIds.filter(pIds => pIds !== userId))
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
                    const isSame = prev.find(member => member.userId === userData.userId);
                    if (!isSame) {
                        return [...prev, userData]
                    }
                    return prev;
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

    useEffect(() => {
        if (chatData.chatType !== "GROUP") return;
        const subscriptions = [];
        for (const id of participantIds) {
            console.log("ShowGroupMembers: called checkOtherUserStatus()")
            const subscription = checkOtherUserStatus(id);
            if (subscription) {
                subscriptions.push(subscription);
            }
        }
        return (() => {
            subscriptions.forEach(sub => {
                if (sub && sub.unsubscribe) {
                    sub.unsubscribe();
                }
            })
        })
    }, [checkOtherUserStatus, participantIds])
    return (
        <div className={style.groupContainer}>
            <h3 className={style.title}>Group Members</h3>
            <div className={style.membersList}>
                {groupMembers.length > 0 &&
                    groupMembers.map((user) => {
                        console.log("ShowGroupMember: UserId\n", user.userId)
                        const statusInfo = userStatusMap[user.userId];
                        console.log(statusInfo);
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