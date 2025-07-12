

import axios from "axios";
import axiosInterceptor from "../Component/Interceptor";
import baseUrl from "../baseUrl";

export const handlePromoteUser = async(token,logout,user,chatData) =>{
    if( !token) return;
    try{
        const response =  await axiosInterceptor.put(`${baseUrl}/api/chats/promoteUserToAdmin?chatId=${chatData.chatId}&userId=${user.userId}`,{},{
            headers:{
                Authorization: `Bearer ${token}`
            }
        })
        console.log(response.data);
        return response.data;
    }catch(error){
        console.log("MemberService: Error: ",error.response)
        if(error.response.status === 401){
            logout()
        }
        return null;
    }
}

export const handleRemoveUser = async (token,logout,user,chatData) => {
    if(!token) return
    try{
        const response = await axiosInterceptor.put(`${baseUrl}/api/chats/removeUser?chatId=${chatData.chatId}&userId=${user.userId}`
            ,{},{
                headers:{Authorization: `Bearer ${token}`}
            }
        )
        console.log("ChatData: ",response.data)
        return response.data;
    }catch(error){
        console.log("MemberService: Error: ",error.response);
        if(error.response.status === 401){
            logout()
        }
        return null;
    }

}