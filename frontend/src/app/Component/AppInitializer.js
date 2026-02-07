import { useEffect } from "react";
import { useNotification } from "../context/NotificationContext";
import { setNotifyFunction } from "./Interceptor";

export default function AppInitializer(){
    const {error} = useNotification();

    useEffect(()=>{
        setNotifyFunction(error);
    },[error])
}