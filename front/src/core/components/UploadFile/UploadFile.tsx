import styles from "./UploadFile.module.scss";
import { useState, useRef, useEffect } from "react";
import { Upload, X, Play, FileVideo, Music } from "lucide-react";

interface UploadFileProps {
  onFileSelect?: (file: File | null) => void;
  fileType?: "video" | "audio" | "both";
}

function UploadFile({ onFileSelect, fileType = "both" }: UploadFileProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Определяем тип файла на основе пропа
  const isVideoType = fileType === "video" || fileType === "both";
  const isAudioType = fileType === "audio" || fileType === "both";
  const isVideoFile = selectedFile?.type.startsWith("video/");
  const isAudioFile = selectedFile?.type.startsWith("audio/");

  // Создаем превью для видео или аудио
  useEffect(() => {
    if (selectedFile) {
      if (isVideoFile && isVideoType) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } else if (isAudioFile && isAudioType) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }, [selectedFile, isVideoType, isAudioType]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file) {
      const isValidVideo = isVideoType && file.type.startsWith("video/");
      const isValidAudio = isAudioType && file.type.startsWith("audio/");
      
      if (isValidVideo || isValidAudio) {
        setSelectedFile(file);
        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    }
  };

  const handleRemoveFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onFileSelect) {
      onFileSelect(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const isValidVideo = isVideoType && file.type.startsWith("video/");
      const isValidAudio = isAudioType && file.type.startsWith("audio/");
      
      if (isValidVideo || isValidAudio) {
        setSelectedFile(file);
        if (onFileSelect) {
          onFileSelect(file);
        }
      }
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={styles.UploadFile}>
      {!selectedFile ? (
        // Состояние загрузки
        <div
          className={`${styles.uploadArea} ${isDragOver ? styles.dragOver : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <div className={styles.uploadContent}>
            <div className={styles.uploadIcon}>
              <Upload size={48} />
            </div>
            <h3 className={styles.uploadTitle}>
              {isDragOver
                ? "Отпустите файл здесь"
                : fileType === "audio"
                ? "Загрузите аудио файл"
                : fileType === "video"
                ? "Загрузите видео файл"
                : "Загрузите файл"}
            </h3>
            <p className={styles.uploadDescription}>
              Перетащите файл сюда или нажмите для выбора
            </p>
            <div className={styles.uploadHint}>
              {fileType === "audio" ? (
                <>
                  <Music size={16} />
                  <span>Поддерживаются аудио файлы</span>
                </>
              ) : fileType === "video" ? (
                <>
                  <FileVideo size={16} />
                  <span>Поддерживаются видео файлы</span>
                </>
              ) : (
                <>
                  <FileVideo size={16} />
                  <span>Поддерживаются видео и аудио файлы</span>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Состояние с выбранным файлом
        <div className={styles.filePreview}>
          <div className={styles.previewHeader}>
            <div className={styles.fileInfo}>
              {isAudioFile ? <Music size={20} /> : <FileVideo size={20} />}
              <div className={styles.fileDetails}>
                <p className={styles.fileName}>{selectedFile.name}</p>
                <p className={styles.fileSize}>{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className={styles.removeButton}
              title="Удалить файл"
            >
              <X size={20} />
            </button>
          </div>

          {preview && isVideoFile && (
            <div className={styles.videoPreview}>
              <video
                ref={videoRef}
                src={preview}
                controls
                className={styles.video}
                preload="metadata"
              />
              <div className={styles.videoOverlay}>
                <button
                  type="button"
                  className={styles.playButton}
                  onClick={() => videoRef.current?.play()}
                >
                  <Play size={24} fill="currentColor" />
                </button>
              </div>
            </div>
          )}

          {preview && isAudioFile && (
            <div className={styles.audioPreview}>
              <audio
                ref={audioRef}
                src={preview}
                controls
                className={styles.audio}
                preload="metadata"
              />
            </div>
          )}

          <button
            type="button"
            onClick={triggerFileSelect}
            className={styles.changeFileButton}
          >
            <Upload size={16} />
            Выбрать другой файл
          </button>
        </div>
      )}

      <input
        id="file"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={
          fileType === "audio"
            ? "audio/*"
            : fileType === "video"
            ? "video/*"
            : "video/*,audio/*"
        }
        className={styles.hiddenInput}
      />
    </div>
  );
}

export default UploadFile;
