import styles from "./UploadFile.module.scss";
import { useState, useRef, useEffect } from "react";
import { Upload, X, Play, FileVideo } from "lucide-react";

interface UploadFileProps {
  onFileSelect?: (file: File | null) => void;
}

function UploadFile({ onFileSelect }: UploadFileProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Создаем превью видео
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith("video/")) {
      const url = URL.createObjectURL(selectedFile);
      setVideoPreview(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setVideoPreview(null);
    }
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const handleRemoveFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedFile(null);
    setVideoPreview(null);
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
      if (file.type.startsWith("video/")) {
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
              {isDragOver ? "Отпустите файл здесь" : "Загрузите видео файл"}
            </h3>
            <p className={styles.uploadDescription}>
              Перетащите файл сюда или нажмите для выбора
            </p>
            <div className={styles.uploadHint}>
              <FileVideo size={16} />
              <span>Поддерживаются видео файлы</span>
            </div>
          </div>
        </div>
      ) : (
        // Состояние с выбранным файлом
        <div className={styles.filePreview}>
          <div className={styles.previewHeader}>
            <div className={styles.fileInfo}>
              <FileVideo size={20} />
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

          {videoPreview && (
            <div className={styles.videoPreview}>
              <video
                ref={videoRef}
                src={videoPreview}
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
        accept="video/*"
        className={styles.hiddenInput}
      />
    </div>
  );
}

export default UploadFile;
