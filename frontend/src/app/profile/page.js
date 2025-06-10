"use client"
import { useEffect, useState } from "react";
import baseUrl from "../baseUrl";
import axiosInterceptor from "../Component/Interceptor";
import { useAuth } from "../context/AuthContext";
import style from "../Style/profile.module.css"

const Profile = () => {
    const { userId, token, isLoading, logout } = useAuth();
    
    const [user, setUser] = useState({
        username: "",
        lastSeen: "",
        phoneNumber: "",
        email: "",
        status: "",
        profilePicture: "",
    });
    
    // Add state for profile image URL
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [imageLoading, setImageLoading] = useState(false);

    const timeformat = (time) => {
        if (!time) return "Unknown";
        return new Date(time).toLocaleString("en-us",{
            day:'2-digit',
            month:'long',
            year:'numeric',
            hour12:true,
            hour:"2-digit",
            minute:"2-digit"
        });
    }

    // Function to fetch profile image with authentication
    const fetchProfileImage = async () => {
        if (!userId || !token) return;
        
        setImageLoading(true);
        try {
            const response = await axiosInterceptor.get(
                `${baseUrl}/api/users/getUserImage/user/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob' // Important: Get response as blob
                }
            );
            
            // Create object URL from blob
            const imageUrl = URL.createObjectURL(response.data);
            setProfileImageUrl(imageUrl);
        } catch (error) {
            console.log('Failed to fetch profile image:', error);
            setProfileImageUrl(null);
        } finally {
            setImageLoading(false);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await axiosInterceptor.get(`${baseUrl}/api/users/current-user`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log(response.data);
            setUser(response.data);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (token && userId) {
            fetchUser();
            fetchProfileImage();
        }
    }, [token, userId]);

    // Cleanup object URL when component unmounts or image changes
    useEffect(() => {
        return () => {
            if (profileImageUrl) {
                URL.revokeObjectURL(profileImageUrl);
            }
        };
    }, [profileImageUrl]);

    if (isLoading) {
        return <div className={style.loading}>Loading authentication....</div>
    }

    return (
        <div className={style.body}>
            <div className={style.profilecontainer}>
                <div className={style.profilepicture}>
                    {imageLoading ? (
                        <div className={style.placeholder}>⏳</div>
                    ) : profileImageUrl ? (
                        <img 
                            src={profileImageUrl}
                            alt="Profile Picture" 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div className={style.placeholder}>👤</div>
                    )}
                </div>
                
                <h1 className={style.username}>{user.username || "Anonymous User"}</h1>
                <span className={`${style.status} ${style[user.status?.toLowerCase()]}`}>
                    {user.status || "offline"}
                </span>
                
                <div className={style.profileinfo}>
                    <div className={style.infoitem}>
                        <div className={`${style.infoicon} ${style.phone}`}>📞</div>
                        <div className={style.infocontent}>
                            <div className={style.infolabel}>Phone Number</div>
                            <div className={style.infovalue}>
                                {user.phoneNumber || "Not provided"}
                            </div>
                        </div>
                    </div>
                    
                    <div className={style.infoitem}>
                        <div className={`${style.infoicon} ${style.email}`}>✉️</div>
                        <div className={style.infocontent}>
                            <div className={style.infolabel}>Email Address</div>
                            <div className={style.infovalue}>
                                {user.email || "Not provided"}
                            </div>
                        </div>
                    </div>
                    
                    <div className={style.infoitem}>
                        <div className={`${style.infoicon} ${style.time}`}>🕐</div>
                        <div className={style.infocontent}>
                            <div className={style.infolabel}>Last Seen</div>
                            <div className={style.infovalue}>
                                {timeformat(user.lastSeen)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile;