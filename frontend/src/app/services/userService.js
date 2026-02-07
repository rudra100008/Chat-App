
import axios from "axios";
import axiosInterceptor from "../Component/Interceptor";

export const fetchUserData = async (logout) => {
    try {
        const response = await axiosInterceptor.get(`/api/users/current-user`, {
    
        });
        console.log("UserService: Response from server", response.data);
        return response.data; 
    } catch (error) {
        console.log("UserService: Error from server", error.response?.data);
        if (error.response?.status === 401) {
            logout();
        }
        return null;
    }
};


export const fetchUserImage = async(userId =0) =>{
    try{
        const response  = await axiosInterceptor.get(`/api/users/getUserImage/user/${userId}`,{
            responseType:'blob'
        });
        console.log("Response of fetchUserImage: ",response.data);
        return response.data;
    }catch(err){
        console.log("Error in fetchUserImage: ",err);
        throw err;
    }
}
