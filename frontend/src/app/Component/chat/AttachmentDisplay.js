"use client"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import style from '../../Style/attachment.module.css'
import {
    faFile, faFileImage, faFilePdf, faFileWord,
    faFileExcel, faFilePowerpoint, faFileAudio,
    faFileVideo, faFileZipper, faDownload
} from '@fortawesome/free-solid-svg-icons';
import axiosInterceptor from '../Interceptor';
import { useState } from 'react';

// Map file extension → icon + accent color
const getFileTypeInfo = (fileName) => {
    const ext = fileName?.split('.').pop()?.toLowerCase() || '';
    const map = {
        pdf:  { icon: faFilePdf,         color: '#ef5350', bg: 'rgba(239,83,80,0.12)',  label: 'PDF' },
        doc:  { icon: faFileWord,        color: '#42a5f5', bg: 'rgba(66,165,245,0.12)', label: 'Word' },
        docx: { icon: faFileWord,        color: '#42a5f5', bg: 'rgba(66,165,245,0.12)', label: 'Word' },
        xls:  { icon: faFileExcel,       color: '#66bb6a', bg: 'rgba(102,187,106,0.12)',label: 'Excel' },
        xlsx: { icon: faFileExcel,       color: '#66bb6a', bg: 'rgba(102,187,106,0.12)',label: 'Excel' },
        ppt:  { icon: faFilePowerpoint,  color: '#ffa726', bg: 'rgba(255,167,38,0.12)', label: 'PPT' },
        pptx: { icon: faFilePowerpoint,  color: '#ffa726', bg: 'rgba(255,167,38,0.12)', label: 'PPT' },
        jpg:  { icon: faFileImage,       color: '#ab47bc', bg: 'rgba(171,71,188,0.12)', label: 'Image' },
        jpeg: { icon: faFileImage,       color: '#ab47bc', bg: 'rgba(171,71,188,0.12)', label: 'Image' },
        png:  { icon: faFileImage,       color: '#ab47bc', bg: 'rgba(171,71,188,0.12)', label: 'Image' },
        gif:  { icon: faFileImage,       color: '#ab47bc', bg: 'rgba(171,71,188,0.12)', label: 'Image' },
        svg:  { icon: faFileImage,       color: '#ab47bc', bg: 'rgba(171,71,188,0.12)', label: 'Image' },
        mp3:  { icon: faFileAudio,       color: '#26c6da', bg: 'rgba(38,198,218,0.12)', label: 'Audio' },
        wav:  { icon: faFileAudio,       color: '#26c6da', bg: 'rgba(38,198,218,0.12)', label: 'Audio' },
        mp4:  { icon: faFileVideo,       color: '#ec407a', bg: 'rgba(236,64,122,0.12)', label: 'Video' },
        avi:  { icon: faFileVideo,       color: '#ec407a', bg: 'rgba(236,64,122,0.12)', label: 'Video' },
        mkv:  { icon: faFileVideo,       color: '#ec407a', bg: 'rgba(236,64,122,0.12)', label: 'Video' },
        mov:  { icon: faFileVideo,       color: '#ec407a', bg: 'rgba(236,64,122,0.12)', label: 'Video' },
        zip:  { icon: faFileZipper,      color: '#8d6e63', bg: 'rgba(141,110,99,0.12)', label: 'ZIP' },
        rar:  { icon: faFileZipper,      color: '#8d6e63', bg: 'rgba(141,110,99,0.12)', label: 'ZIP' },
    };
    return map[ext] || { icon: faFile, color: '#4fc3f7', bg: 'rgba(79,195,247,0.1)', label: ext.toUpperCase() || 'File' };
};

const formatFileSize = (bytes) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AttachmentDisplay = ({ message }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadDone, setDownloadDone] = useState(false);

    const rawName = message.attachment?.fileName || "unknown_file";
    const underscoreIdx = rawName.indexOf("_");
    const displayName = underscoreIdx !== -1 ? rawName.substring(underscoreIdx + 1) : rawName;
    const fileSize = message.attachment?.fileSize;
    const typeInfo = getFileTypeInfo(displayName);

    const downloadAttachment = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            const res = await axiosInterceptor.get(`/${message.attachment.url}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = displayName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setDownloadDone(true);
            setTimeout(() => setDownloadDone(false), 2500);
        } catch (err) {
            console.error('Download failed:', err?.response?.data || err.message);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className={style.bubble}>
            {/* File type icon block */}
            <div
                className={style.iconBlock}
                style={{ background: typeInfo.bg, color: typeInfo.color }}
            >
                <FontAwesomeIcon icon={typeInfo.icon} />
                <span className={style.typeLabel} style={{ color: typeInfo.color }}>
                    {typeInfo.label}
                </span>
            </div>

            {/* File info */}
            <div className={style.fileInfo}>
                <p className={style.fileName} title={displayName}>
                    {displayName.length > 28 ? displayName.slice(0, 26) + "…" : displayName}
                </p>
                {fileSize && (
                    <p className={style.fileSize}>{formatFileSize(fileSize)}</p>
                )}
            </div>

            {/* Download button */}
            <button
                className={`${style.downloadBtn} ${isDownloading ? style.downloading : ""} ${downloadDone ? style.done : ""}`}
                onClick={downloadAttachment}
                disabled={isDownloading}
                title="Download"
            >
                {isDownloading ? (
                    <span className={style.spinner} />
                ) : downloadDone ? (
                    <span className={style.doneCheck}>✓</span>
                ) : (
                    <FontAwesomeIcon icon={faDownload} />
                )}
            </button>
        </div>
    );
};

export default AttachmentDisplay;