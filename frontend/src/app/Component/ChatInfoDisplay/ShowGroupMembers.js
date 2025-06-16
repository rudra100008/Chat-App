"use client"
import { useAuth } from "@/app/context/AuthContext";
import style from "../../Style/chatInfoDisplay.module.css";
import { useEffect, useState } from "react";
import axiosInterceptor from "../Interceptor";
import baseUrl from "@/app/baseUrl";
import GetUserImage from "../GetUserImage";
const ShowGroupMembers = ({ chatData }) => {
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
    return (
        <div className={style.groupContainer}>
            <h3 className={style.title}>Group Members</h3>
            <div className={style.membersList}>
                 {groupMembers.length > 0 &&
                groupMembers.map((user) => (
                    <div key={user.userId} className={style.memberCard}>
                         <div className={style.imageContainer}>
                                <GetUserImage userId={user.userId} size={40} />
                                {/* You can add online/offline status here if available */}
                                {/* <div className={style.onlineIndicator}></div> */}
                            </div>
                        <span className={style.username}>{user.username}</span>
                    </div>
                ))}
            </div>
        </div>
    );

}
export default ShowGroupMembers;