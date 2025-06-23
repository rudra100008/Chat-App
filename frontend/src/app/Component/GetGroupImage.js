"use client"
import Image from "next/image";
import style from "../Style/image.module.css";
import { useEffect, useState } from "react";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import { useAuth } from "../context/AuthContext";
const GetGroupImage = ({ chatId, selectedChatInfo, size = 40 }) => {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [isImageLoaded,setIsImageLoaded] = useState(false);
    const { token } = useAuth();
    useEffect(() => {

        const fetchGroupImage = async () => {
            setLoading(true);
            try {
                const response = await axiosInterceptor.get(`${baseUrl}/api/chats/groupImage?chatId=${chatId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: "blob"
                })
                const url = URL.createObjectURL(response.data);
                setImageUrl(url);
            } catch (error) {
                console.log(error.response)
            } finally {
                setLoading(false);
            }
        }
        if (chatId) fetchGroupImage();
    }, [chatId,selectedChatInfo])

    if (loading) {
        return (
            <div className='font-semibold text-xs'>
                Loading...
            </div>
        )
    }
    return (
        <>
            {imageUrl && (
                <div className={`${style.imageWrapper} ${isImageLoaded ? style.loaded : ""}`} style={{ height: size, width: size }}>
                    <Image
                        src={imageUrl}
                        alt="Group"
                        fill
                        className={style.imageresponsive}
                        onLoad={()=> setIsImageLoaded(true)}
                    />
                </div>
            )}
        </>
    )
}
export default GetGroupImage;