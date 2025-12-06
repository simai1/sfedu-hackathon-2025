import styles from "./UploadAudioFile.module.scss";
import { useState, useRef, useEffect } from "react";
import { Upload, X, Music } from "lucide-react";

interface UploadAudioFileProps {
  onFileSelect?: (file: File | null) => void;
}

function UploadAudioFile({ onFileSelect }: UploadAudioFileProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Создаем превью аудио
  useEffect(() => {
    if (selectedFile && selectedFile.type.startsWith("audio/")) {
      const url = URL.createObjectURL(selectedFile);
      setAudioPreview(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setAudioPreview(null);
    }
  }, [selectedFile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (file && file.type.startsWith("audio/")) {
      setSelectedFile(file);
      if (onFileSelect) {
        onFileSelect(file);
      }
    }
  };

  const handleRemoveFile = (event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedFile(null);
    setAudioPreview(null);
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
      if (file.type.startsWith("audio/")) {
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
    <div className={styles.UploadAudioFile}>
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
              {isDragOver ? "Отпустите файл здесь" : "Загрузите аудио файл"}
            </h3>
            <p className={styles.uploadDescription}>
              Перетащите файл сюда или нажмите для выбора
            </p>
            <div className={styles.uploadHint}>
              <Music size={16} />
              <span>Поддерживаются аудио файлы (MP3, WAV, OGG и др.)</span>
            </div>
          </div>
        </div>
      ) : (
        // Состояние с выбранным файлом
        <div className={styles.filePreview}>
          <div className={styles.previewHeader}>
            <div className={styles.fileInfo}>
              <Music size={20} />
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

          {audioPreview && (
            <div className={styles.audioPreview}>
              <audio
                ref={audioRef}
                src={audioPreview}
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
        id="audioFile"
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className={styles.hiddenInput}
      />
    </div>
  );
}

export default UploadAudioFile;

