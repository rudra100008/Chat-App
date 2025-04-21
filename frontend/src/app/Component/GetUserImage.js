"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import baseUrl from "../baseUrl";
import axiosInterceptor from "./Interceptor";

const token = () => localStorage.getItem("token");

export default function GetUserImage({ userId }) {
    const [imageUrl, setImageUrl] = useState("");

    useEffect(() => {
        console.log("UserId in GetImage:\n",userId)
        const fetchUserImage = async () => {
            try {
                const response = await axiosInterceptor.get(`${baseUrl}/api/users/getUserImage/user/${userId}`, {
                    headers: { Authorization: `Bearer ${token()}` },
                    responseType: 'blob',
                });
                console.log("Image:\n\n",response.data)
                const url = URL.createObjectURL(response.data);
                setImageUrl(url);
            } catch (error) {
                console.error("Error fetching user image:", error.response);
            }
        };

        if (userId) fetchUserImage();
    }, [userId]);

    return (
        <>
            {imageUrl && (
                <Image
                    src={imageUrl}
                    alt="User"
                    width={30} // 96px = 6rem (Tailwind w-24)
                    height={30}
                    className="rounded-full object-cover"
                />
            )}
        </>
    );
}
