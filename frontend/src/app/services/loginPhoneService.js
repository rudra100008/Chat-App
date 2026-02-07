import axiosInterceptor from "../Component/Interceptor";

export const initiatePhoneLogin = async (request) =>{
    try{
        const response = await axiosInterceptor.post('/auth/login-phone',request);
        console.log("Response in loginPhoneService:",response.data );
        return response.data
    }catch(err){
        console.log("Error in LoginPhoneService.js:",err.response?.data);
        throw err;
    }
}