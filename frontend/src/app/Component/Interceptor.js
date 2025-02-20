const { default: axios } = require("axios");


const axiosInterceptor = axios.create();


axiosInterceptor.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const isTokenValid = localStorage.getItem("isTokenValid");

        // Only add token to headers if both token exists and is valid
        if (token && isTokenValid === "true") {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            // If token is invalid, redirect to login
            window.location.href = "http://localhost:3000";
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

axiosInterceptor.interceptors.response.use(
    (response)=>{
        return response;
    },
    (error)=>{
        if(error.response && error.response.status === 401){
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
            window.location.href ="http://localhost:3000";
        }
        return Promise.reject(error);
    }
)

export default axiosInterceptor;