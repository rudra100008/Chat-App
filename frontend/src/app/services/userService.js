
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


export const fetchUserImageSecureUrlService = async(userId =0) =>{
    try{
        const response  = await axiosInterceptor.get(`/api/users/${userId}/fetchImageUrl`);
        console.log("Response of fetchUserImage: ",response.data);
        return response.data;
    }catch(err){
        console.log("Error in fetchUserImage: ",err);
        throw err;
    }
}


export const updateUserImageService = async(userId=0, imageFile) => {
    try{
        const formData = new FormData();
        formData.append("imageFile",imageFile);
        const response = await axiosInterceptor.patch(`/api/users/${userId}/updateImage`,formData,{
            headers:{
                "Content-Type": 'multipart/form-data'
            }
        })
        console.log("Response in updateUserImageService:",response);
        return response.data;
    }catch(err){
        console.error("Error in updateUserImageService: ",err)
        throw err;
    }
}

export const updateUserDataService = async(userId=0,userData={}) => {
    try{
        const response  = await axiosInterceptor.put(`api/users/${userId}/updateUserData`,userData);
        console.log("Response of updateUserDataService: ",response);
        return response.data;
    }catch(err){
        console.error("Error of updateUserData: ",err);
        throw err;
    }
}
