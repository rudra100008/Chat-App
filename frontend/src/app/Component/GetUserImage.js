"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import baseUrl from "../baseUrl";
import axiosInterceptor from "./Interceptor";
import { useAuth } from "../context/AuthContext";
import style from "../Style/image.module.css";
import { fetchUserImageSecureUrlService } from "../services/userService";

export default function GetUserImage({ userId ,size = 40}) {
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
       const fetchUserImageUrl = async () =>{
        try{
            const data = await fetchUserImageSecureUrlService(userId);
            setImageUrl(data.secureUrl);
        }catch(err){
            console.error("Error in fetchUserImageUrl: ",err.response?.data);
        }
       }

        if (userId) fetchUserImageUrl();
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
