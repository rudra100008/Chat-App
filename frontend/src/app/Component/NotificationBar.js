'use client'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useNotification } from '../context/NotificationContext';
import style from '../Style/notificationBar.module.css';
import { faX } from '@fortawesome/free-solid-svg-icons';
export default function NotificationBar(){
    const { notification,clear} = useNotification();
     if(notification?.message){
            return(
            <div className={style.container}>
                <span>{notification?.message || ''}</span>
                <button onClick={clear}>
                    <FontAwesomeIcon icon={faX}/>
                </button>
            </div>
            )
        }
}