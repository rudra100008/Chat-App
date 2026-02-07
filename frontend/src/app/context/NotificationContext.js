'use client'
import { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notification,setNotification] = useState(null);

    const success = (message) =>{
        setNotification({type:"success",message:message});
    }

    const error = (message) => {
        setNotification({type:"error",message:message});
    }

    const clear = (message) => {
        setNotification(null)
    }
    const value = {
        success,
        error,
        clear,
        setNotification,
        notification
    }

    return(
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotification = () => useContext(NotificationContext);