"use client"
import style from '../Style/errorMessage.module.css'
export default function ErrorMessage({ errorMessage, onClose }) {
    if (!errorMessage) return null;
    const handleClose=()=>{
        if(onClose) onClose();
    }
    return (
        <div>
            {errorMessage &&
                <div className={style.errorBox}>
                    <p className={style.errorMessage}>{errorMessage}</p>
                    <button className={style.closeButton} onClick={handleClose}>
                        Close
                    </button>
                </div>}
        </div>
    )
}