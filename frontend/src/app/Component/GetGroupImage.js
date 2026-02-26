"use client"
import Image from "next/image";
import style from "../Style/image.module.css";
import { useEffect, useState } from "react";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import { useAuth } from "../context/AuthContext";
const GetGroupImage = ({ chatId, chatType, size = 40 }) => {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [isImageLoaded,setIsImageLoaded] = useState(false);
    useEffect(() => {
        // Early return if not a group chat or missing chatId
        if(!chatId || chatType !== "GROUP") {
            setImageUrl(""); // Clear image URL when switching to non-group chat
            return;
        }

        const fetchGroupImage = async () => {
            setLoading(true);
            try {
                const response = await axiosInterceptor.get(`/api/chats/${chatId}/fetchGroupImage`)
                console.log("fetchGroupImage response: ", response.data)
                const {secureUrl} = response.data;
                setImageUrl(secureUrl);
            } catch (error) {
                console.error("Error in fetchGroupImage: ",error);
                setImageUrl(""); // Clear on error
            } finally {
                setLoading(false);
            }
        }
        
        fetchGroupImage();
    }, [chatId, chatType])

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
                        sizes="(max-width: 640px) 40px, 50px"
                        className={style.imageresponsive}
                        onLoad={()=> setIsImageLoaded(true)}
                    />
                </div>
            )}
        </>
    )
}
export default GetGroupImage;