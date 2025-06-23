"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../Style/errorMessage.module.css'
import { faWarning } from '@fortawesome/free-solid-svg-icons';
export default function ErrorPrompt({ errorMessage, setErrorMessage }) {
    if (!errorMessage) return null;
     const closeErrorMessage = () => {
        setErrorMessage("");
    }
    return (
        <div className={style.errorOverlay}>
            {errorMessage &&
                <div className={style.errorBox}>
                    <p className={style.errorMessage}>
                        <FontAwesomeIcon icon={faWarning} />
                        {errorMessage}
                    </p>
                    <button className={style.closeButton} onClick={closeErrorMessage}>
                        Close
                    </button>
                </div>}
        </div>
    )
}