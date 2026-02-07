
import axiosInterceptor from "../Component/Interceptor";


export const handlePromoteUser = async(logout,user,chatData) =>{
    try{
        const response =  await axiosInterceptor.put(`/api/chats/promoteUserToAdmin?chatId=${chatData.chatId}&userId=${user.userId}`,{},{
          
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

export const handleRemoveUser = async (logout,user,chatData) => {
    try{
        const response = await axiosInterceptor.put(`/api/chats/removeUser?chatId=${chatData.chatId}&userId=${user.userId}`
            ,{}
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