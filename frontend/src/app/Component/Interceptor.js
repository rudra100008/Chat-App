import baseUrl from "../baseUrl";
import Message from "./chat/Message";

const { default: axios } = require("axios");

let notify;
export const setNotifyFunction = (fn) => {
  notify = fn;
};

const axiosInterceptor = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

axiosInterceptor.interceptors.request.use(
  (config) => {
    console.log("Request URL:", config.url);
    console.log("With credentials:", config.withCredentials);
    const token = localStorage.getItem("token");
    console.log("hasToken: ", token !== null);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Authorization header added to request");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

  axiosInterceptor.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        console.log("ErrorResponse: ", error.response);
        if (notify) notify(error.response?.data.message);
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else if (error.response && error.response.status === 403) {
        console.log("ErrorResponse: ", error.response);
        if (notify) notify(error.response?.data.message);
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        console.log(error.response);
      }
      return Promise.reject(error);
    },
  );


export default axiosInterceptor;
