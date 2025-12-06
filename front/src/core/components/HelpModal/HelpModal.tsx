import { X, Download, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import styles from "./HelpModal.module.scss";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [downloadMessage, setDownloadMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleDownload = async (platform: "windows" | "macos" | "linux") => {
    setIsDownloading(platform);
    setDownloadStatus("idle");
    setDownloadMessage("");

    try {
      const downloadUrl = "http://5.129.252.186:3000/uploads/Windows_app.zip";

      // Скачиваем файл
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error("Ошибка скачивания файла");
      }

      // Получаем blob
      const blob = await response.blob();

      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `BrainBit-${platform}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadStatus("success");
      setDownloadMessage(
        `Приложение для ${
          platform === "windows"
            ? "Windows"
            : platform === "macos"
            ? "macOS"
            : "Linux"
        } успешно скачано!`
      );
      setTimeout(() => {
        setDownloadStatus("idle");
        setDownloadMessage("");
      }, 3000);
    } catch (error) {
      console.error("Ошибка при скачивании файла:", error);
      setDownloadStatus("error");
      setDownloadMessage("Ошибка при скачивании файла. Попробуйте снова.");
    } finally {
      setIsDownloading(null);
    }
  };

  const steps = [
    {
      number: 1,
      title: "Регистрация в приложении",
      description:
        "Зарегистрируйтесь в веб-приложении, создав аккаунт с вашим именем пользователя, email и паролем.",
    },
    {
      number: 2,
      title: "Получение токена",
      description:
        "После входа в систему перейдите в раздел 'Профиль' и скопируйте ваш API токен. Этот токен необходим для подключения desktop приложения.",
    },
    {
      number: 3,
      title: "Скачивание приложения",
      description:
        "Скачайте и установите desktop приложение BrainBit на ваш компьютер. Приложение доступно для Windows, macOS и Linux.",
    },
    {
      number: 4,
      title: "Подключение к браслету BrainBit",
      description:
        "Включите ваш браслет BrainBit и запустите desktop приложение. Введите скопированный API токен в настройках приложения для подключения к веб-сервису.",
    },
    {
      number: 5,
      title: "Работа с видео",
      description:
        "В разделе 'Анализ' загрузите видеофайл, который хотите проанализировать. Система автоматически начнет запись данных с браслета при воспроизведении видео.",
    },
    {
      number: 6,
      title: "Анализ данных",
      description:
        "Во время просмотра видео вы увидите графики в реальном времени: концентрацию, Расслабленность, данные по каналам (O1, O2, T3, T4) и спектральные показатели (Alpha, Beta, Gamma). После завершения анализа вы получите детальный отчет.",
    },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Инструкция по использованию</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.stepsContainer}>
            {steps.map((step) => (
              <div key={step.number} className={styles.step}>
                <div className={styles.stepNumber}>{step.number}</div>
                <div className={styles.stepContent}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepDescription}>{step.description}</p>
                  {step.number === 3 && (
                    <div className={styles.stepDownload}>
                      {downloadMessage && (
                        <div
                          className={`${styles.downloadMessage} ${
                            downloadStatus === "success"
                              ? styles.success
                              : downloadStatus === "error"
                              ? styles.error
                              : ""
                          }`}
                        >
                          {downloadStatus === "success" && (
                            <CheckCircle2 size={16} />
                          )}
                          {downloadStatus === "error" && <X size={16} />}
                          <span>{downloadMessage}</span>
                        </div>
                      )}
                      <div className={styles.downloadButtonsContainer}>
                        <button
                          className={styles.downloadButton}
                          onClick={() => handleDownload("windows")}
                          disabled={isDownloading !== null}
                          type="button"
                        >
                          {isDownloading === "windows" ? (
                            <>
                              <Loader2 className={styles.spinning} size={18} />
                              <span>Скачивание...</span>
                            </>
                          ) : (
                            <>
                              <Download size={18} />
                              <span>Windows</span>
                            </>
                          )}
                        </button>
                        <button
                          className={styles.downloadButton}
                          onClick={() => handleDownload("macos")}
                          disabled={isDownloading !== null}
                          type="button"
                        >
                          {isDownloading === "macos" ? (
                            <>
                              <Loader2 className={styles.spinning} size={18} />
                              <span>Скачивание...</span>
                            </>
                          ) : (
                            <>
                              <Download size={18} />
                              <span>macOS</span>
                            </>
                          )}
                        </button>
                        <button
                          className={styles.downloadButton}
                          onClick={() => handleDownload("linux")}
                          disabled={isDownloading !== null}
                          type="button"
                        >
                          {isDownloading === "linux" ? (
                            <>
                              <Loader2 className={styles.spinning} size={18} />
                              <span>Скачивание...</span>
                            </>
                          ) : (
                            <>
                              <Download size={18} />
                              <span>Linux</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.closeFooterButton} onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
