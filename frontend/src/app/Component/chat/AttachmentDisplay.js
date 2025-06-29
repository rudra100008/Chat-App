"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/attachment.module.css'
import { faFile } from '@fortawesome/free-solid-svg-icons';
import axiosInterceptor from '../Interceptor';
import baseUrl from '@/app/baseUrl';
import { useAuth } from '@/app/context/AuthContext';

const AttachmentDisplay = ({ message }) => {
    const {token} = useAuth();
    const getFileName = (fileName) => {
        let result = fileName.indexOf("_");
        return fileName.substring(result + 1);
    }

    const downloadAttachment = async () =>{
        console.log("Downloading: ",message.attachment.url);
        console.log("Full URL:", `${baseUrl}/${message.attachment?.url}`);
        await axiosInterceptor.get(`${baseUrl}/${message.attachment.url}`,{
            headers :{Authorization : `Bearer ${token}`},
            responseType:'blob'
        }).then((res)=>{
            const blob = res.data;
              console.log('Blob created:', blob);
            console.log('Blob size:', blob.size);
            console.log('Blob type:', blob.type);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = getFileName(message.attachment.fileName);
            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
             console.log('Download completed');
        }).catch((err)=>{
             console.error('Download failed:', err?.response?.data || err.message);
              console.error('Full error:', err);
        })
    }
    return (
        <div className={style.AttachmentContainer}>
            <div className={style.AttachmentBubble}>
                <div className={style.FileInfo}>
                    <FontAwesomeIcon icon={faFile} size='xl' />
                    {getFileName(message.attachment.fileName)}
                </div>
                <button className={style.SaveButton} onClick={downloadAttachment}>
                    Save As
                </button>
            </div>
        </div>
    )
}
export default AttachmentDisplay;