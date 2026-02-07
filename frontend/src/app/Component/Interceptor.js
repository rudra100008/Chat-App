import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useEffect } from "react";
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export const setUpAxiosInterceptor = () => {
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
    }
  );
};

export default axiosInterceptor;
