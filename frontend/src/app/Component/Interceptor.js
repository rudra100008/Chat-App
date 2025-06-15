import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect } from "react";

const { default: axios } = require("axios");


const axiosInterceptor = axios.create();


axiosInterceptor.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        // Only add token to headers if both token exists and is valid
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)
export const setUpAxiosInterceptor = ()=>{
    const router = useRouter();
    const pathName = usePathname();
    axiosInterceptor.interceptors.response.use(
    (response)=>{
        return response;
    },
    (error)=>{
        if(error.response && error.response.status === 401){
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            if(pathName !== '/'){
                router.push("/")
            }
        }
        else if(error.response && error.response.status === 403){
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
           if(pathName !== '/'){
                router.push("/")
            }
        }else{
            console.log(error.response)
        }
        return Promise.reject(error);
    }
)
   
}


export default axiosInterceptor;