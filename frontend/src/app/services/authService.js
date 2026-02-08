import axiosInterceptor from "../Component/Interceptor";

export const isTokenValidService = async() =>{

    try{
        const response = await axiosInterceptor.get("/auth/verify-token");
        console.log("Response of isTokenValidService(): ",response);
        return response.data;
    }catch(err){
        console.log("Error in isTokenValidService(): ",err);
        throw err;
    }
}


export const logoutService = async () =>{
    try{
        const response =  await axiosInterceptor.get("/auth/logout");
        return response.data;
    }catch(err){
        console.log("Error in logoutService(): ",err);
        throw err;
    }
}