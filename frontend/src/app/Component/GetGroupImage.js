"use client"
import Image from "next/image";
import style from "../Style/image.module.css";
import { useEffect, useState } from "react";
import axiosInterceptor from "./Interceptor";
import baseUrl from "../baseUrl";
import { useAuth } from "../context/AuthContext";
const GetGroupImage = ({chatId, size= 40}) => {
    const [imageUrl,setImageUrl] = useState("");
    const [loading,setLoading] = useState(false);
    const {token} = useAuth();
    useEffect(()=>{

        const fetchGroupImage = async () =>{
            setLoading(true);
        try{
        const response = await axiosInterceptor.get(`${baseUrl}/api/chats/groupImage?chatId=${chatId}`,{
            headers:{Authorization:`Bearer ${token}`},
            responseType : "blob"
        })
        const url = URL.createObjectURL(response.data);
        setImageUrl(url);
        }catch(error){
            console.log(error.response)
        }finally{
            setLoading(false);
        }
    }
    if(chatId) fetchGroupImage();
    },[chatId])

    if(loading){
        return(
            <div className='font-semibold text-xs'>
                Loading...
            </div>
        )
    }
    return(
        <>
            {imageUrl && (
                <div className={style.imageWrapper} style={{height:size,width:size}}>
                     <Image
                    src={imageUrl}
                    alt="Group"
                    fill
                    className={style.imageresponsive}
                />
                </div>
            )}
        </>
    )
}
export default GetGroupImage;