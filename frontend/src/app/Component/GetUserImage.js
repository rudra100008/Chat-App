"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import baseUrl from "../baseUrl";
import axiosInterceptor from "./Interceptor";
import { useAuth } from "../context/AuthContext";
import style from "../Style/image.module.css";

export default function GetUserImage({ userId ,size = 40,className = ""}) {
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        const fetchUserImage = async () => {
            try {
                const response = await axiosInterceptor.get(`${baseUrl}/api/users/getUserImage/user/${userId}`, {

                    responseType: 'blob',
                });
                console.log("Response of UserImage: ",response.data)
                const url = URL.createObjectURL(response.data);
                setImageUrl(url);
            } catch (error) {
                console.error("Error fetching user image:", error);
            }
        };

        if (userId) fetchUserImage();
    }, [userId]);

    return (
        <>
            {imageUrl && (
                <div className={style.imageWrapper} style={{height:size,width:size}}>
                     <Image
                    src={imageUrl}
                    alt="User"
                    fill
                    className={style.imageresponsive}
                />
                </div>
            )}
        </>
    );
}
