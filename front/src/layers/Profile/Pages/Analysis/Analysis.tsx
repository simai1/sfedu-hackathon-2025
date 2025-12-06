import { useState, useEffect, useRef } from "react";
import ChatMessagerComponent from "../../../../core/components/ChatMessagerComponent/ChatMessagerComponent";
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators";
import ConcentrationEngagementChart from "../../modules/graphics/KeyIndicators/components/ConcentrationEngagementChart/ConcentrationEngagementChart";
import UploadFile from "../../../../core/components/UploadFile/UploadFile";
import VideoPlayer, {
  type ScreenshotTrigger,
  type VideoPlayerRef,
} from "../../../../core/components/VideoPlayer/VideoPlayer";
import EyeTrackingCalibration from "../../../../core/components/EyeTrackingCalibration/EyeTrackingCalibration";
import CameraPermission from "../../../../core/components/CameraPermission/CameraPermission";
import Heatmap, {
  type GazePoint,
} from "../../../../core/components/Heatmap/Heatmap";
import VideoAutoPlayHelper from "./VideoAutoPlayHelper";
import { uploadVideo, uploadPhoto } from "../../../../api/files";
import { useUserStore } from "../../../../store/userStore";
import { useWebSocketStore } from "../../../../store/websocketStore";
import styles from "./Analysis.module.scss";

type AnalysisState =
  | "upload"
  | "ready"
  | "cameraPermission"
  | "calibration"
  | "watching"
  | "finished"
  | "reportGenerated";

function Analysis() {
  const { token } = useUserStore();
  const { lastMessage } = useWebSocketStore();
  const [state, setState] = useState<AnalysisState>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isReportGenerating, setIsReportGenerating] = useState(false);
  const [screenshotTriggers, setScreenshotTriggers] = useState<
    ScreenshotTrigger[]
  >([]);
  const [capturedScreenshots, setCapturedScreenshots] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [gazePoints, setGazePoints] = useState<GazePoint[]>([]);
  const [isEyeTrackingActive, setIsEyeTrackingActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 800,
    height: 450,
  });
  const videoDurationRef = useRef<number>(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const uploadedVideoIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gazeCollectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mousePositionRef = useRef<{ x: number; y: number } | null>(null);

  const handleFileSelect = async (file: File | null) => {
    if (file && file.type.startsWith("video/")) {
      setUploadError(null);
      setIsUploading(true);
      setVideoFile(file);

      // Локальный URL для предпросмотра и триггеров
      const localUrl = URL.createObjectURL(file);
      setVideoURL(localUrl);

      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = localUrl;
      video.onloadedmetadata = () => {
        videoDurationRef.current = video.duration;
        const triggers = generateScreenshotTriggers(video.duration);
        setScreenshotTriggers(triggers);
        video.remove();
      };

      try {
        const response = await uploadVideo(file);
        const data = response?.data;

        if (data?.id) {
          setUploadedVideoId(data.id);
          uploadedVideoIdRef.current = data.id; // Обновляем ref
        }

        if (data?.url || data?.video_url) {
          setUploadedVideoUrl(data.url || data.video_url);
        }

        setState("ready");
        connectToSocket();
      } catch (error) {
        setUploadError("Не удалось загрузить видео. Попробуйте еще раз.");
        setState("upload");
        setVideoFile(null);
        setVideoURL(null);
        setScreenshotTriggers([]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const connectToSocket = () => {
    if (!token) {
      setUploadError("Требуется авторизация для подключения к серверу");
      return;
    }

    // Закрываем предыдущее соединение если есть
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    try {
      // Проверяем, не истек ли токен (JWT токены содержат exp)
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp) {
            const expirationTime = payload.exp * 1000; // конвертируем в миллисекунды
            const currentTime = Date.now();
            if (currentTime > expirationTime) {
              setUploadError(
                "Токен авторизации истек. Пожалуйста, войдите заново."
              );
              return;
            }
          }
        }
      } catch (e) {
        // Тихая ошибка проверки токена
      }

      // Используем URL из требований: ws://5.129.252.186:3000/ws/client?token={access_token}
      const host = import.meta.env.VITE_WS_HOST || "5.129.252.186";
      const port = import.meta.env.VITE_WS_PORT || "3000";
      const wsUrl = `ws://${host}:${port}/ws/client?token=${encodeURIComponent(
        token
      )}`;

      const ws = new WebSocket(wsUrl);
      let connectionTimeout: NodeJS.Timeout | null = null;

      // Таймаут для соединения (10 секунд)
      connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          setIsSocketConnected(false);
          setUploadError(
            "Таймаут подключения к серверу. Проверьте интернет-соединение."
          );
        }
      }, 10000);

      ws.onopen = () => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        setIsSocketConnected(true);
        setUploadError(null);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "video_tracking_started") {
            setIsTracking(true);
          } else if (data.type === "video_tracking_ended") {
            setIsTracking(false);
          } else if (data.type === "request_screenshot") {
            // Сервер запрашивает скриншот
            const timestamp = data.timestamp;

            if (!videoPlayerRef.current) {
              return;
            }

            // Получаем timecode СРАЗУ, до создания скриншота, чтобы зафиксировать точное время
            const currentVideoTime =
              videoPlayerRef.current?.getCurrentTime() || 0;
            const timecode = Math.floor(currentVideoTime);

            const imageData = videoPlayerRef.current.captureScreenshot();

            if (!imageData) {
              return;
            }

            // Используем ref для получения актуального значения uploadedVideoId
            const currentVideoId =
              uploadedVideoIdRef.current || uploadedVideoId;

            // Отправляем на сервер только если есть uploadedVideoId
            if (currentVideoId) {
              try {
                // Загружаем фото на сервер через /v1/photos
                const photoResponse = await uploadPhoto(
                  imageData,
                  `screenshot-${Date.now()}.png`
                );

                // Извлекаем URL из ответа
                const photoData = photoResponse?.data;
                let screenshotUrl = null;

                if (photoData) {
                  screenshotUrl =
                    photoData.url || photoData.photo_url || photoData.image_url;
                }

                if (!screenshotUrl) {
                  throw new Error("URL не найден в ответе сервера");
                }

                // Отправляем video_frame на сервер
                const videoFrameMessage = {
                  type: "video_frame",
                  timecode: timecode,
                  video_id: currentVideoId,
                  screenshot_url: screenshotUrl,
                };

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify(videoFrameMessage));
                }
              } catch (error) {
                // Тихая ошибка
              }
            }
          } else if (data.type === "error") {
            setUploadError(`Ошибка сервера: ${data.message}`);
          }
        } catch (error) {
          // Тихая ошибка парсинга
        }
      };

      ws.onerror = (error) => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        setIsSocketConnected(false);
        setUploadError(
          "Ошибка подключения к серверу. Проверьте интернет-соединение."
        );
      };

      ws.onclose = (event) => {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }

        setIsSocketConnected(false);
        setIsTracking(false);

        // Если соединение закрылось не по нашей инициативе и код ошибки не 1000 (нормальное закрытие) или 1005 (No Status)
        if (event.code !== 1000 && event.code !== 1001 && event.code !== 1005) {
          const errorMessages: Record<number, string> = {
            1006: "Соединение закрыто неожиданно. Возможно, сервер недоступен или проблема с сетью.",
            1002: "Ошибка протокола WebSocket.",
            1003: "Недопустимые данные.",
            1008: "Нарушение политики.",
            1009: "Сообщение слишком большое.",
            1011: "Неожиданная ошибка сервера.",
          };

          const errorMessage =
            errorMessages[event.code] ||
            `Соединение закрыто с кодом ${event.code}`;

          // Автоматическое переподключение во время просмотра видео
          if (state === "watching" && event.code === 1011) {
            // Отменяем предыдущее переподключение, если оно было запланировано
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              if (state === "watching" && !isSocketConnected && token) {
                connectToSocket();
              }
              reconnectTimeoutRef.current = null;
            }, 2000); // Переподключение через 2 секунды
          }

          if (state === "ready" || state === "watching") {
            setUploadError(errorMessage);
          }
        }
      };

      wsRef.current = ws;
    } catch (error) {
      setIsSocketConnected(false);
      setUploadError(
        "Не удалось создать WebSocket соединение. Проверьте настройки браузера."
      );
    }
  };
  const generateScreenshotTriggers = (duration: number) => {
    const triggers: ScreenshotTrigger[] = [];
    for (let time = 0; time < duration; time += 2) {
      triggers.push({
        type: "custom",
        timestamp: time,
        message: `Автоматический скриншот`,
      });
    }
    return triggers;
  };

  const handleCalibrationComplete = () => {
    setIsCalibrated(true);
    setState("watching");

    // Небольшая задержка, чтобы компонент успел отрендериться
    setTimeout(() => {
      // Отправляем video_start
      const videoStartMessage = { type: "video_start" };
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(videoStartMessage));
      }

      // Запускаем отслеживание взгляда
      startEyeTracking();
    }, 100);
  };

  const handleCalibrationCancel = () => {
    setState("ready");
  };

  // Получаем размеры видео для тепловой карты
  useEffect(() => {
    const updateVideoDimensions = () => {
      const videoElement = videoPlayerRef.current?.getVideoElement();
      if (videoElement) {
        setVideoDimensions({
          width: videoElement.videoWidth || 800,
          height: videoElement.videoHeight || 450,
        });
      }
    };

    const videoElement = videoPlayerRef.current?.getVideoElement();
    if (videoElement) {
      videoElement.addEventListener("loadedmetadata", updateVideoDimensions);
      updateVideoDimensions();
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener(
          "loadedmetadata",
          updateVideoDimensions
        );
      }
    };
  }, [videoURL, state]);

  // Отслеживание позиции мыши для симуляции взгляда
  useEffect(() => {
    if (!isEyeTrackingActive || !videoContainerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!videoContainerRef.current) return;
      const rect = videoContainerRef.current.getBoundingClientRect();
      const videoElement = videoPlayerRef.current?.getVideoElement();

      if (!videoElement) return;

      // Вычисляем относительные координаты относительно контейнера видео
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Сохраняем позицию мыши
      mousePositionRef.current = { x, y };
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isEyeTrackingActive]);

  const startEyeTracking = () => {
    if (!videoContainerRef.current || !videoPlayerRef.current) return;

    // Убеждаемся, что камера все еще работает
    if (cameraStream) {
      const tracks = cameraStream.getVideoTracks();
      if (tracks.length > 0 && tracks[0].readyState !== "live") {
        // Пытаемся получить доступ к камере снова
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "user" } })
          .then((stream) => {
            setCameraStream(stream);
            if (cameraVideoRef.current) {
              cameraVideoRef.current.srcObject = stream;
              cameraVideoRef.current.play();
            }
          })
          .catch(() => {
            // Тихая ошибка
          });
      }
    }

    setIsEyeTrackingActive(true);
    setGazePoints([]);
    mousePositionRef.current = null;

    // Собираем данные о взгляде каждые 100мс
    gazeCollectionIntervalRef.current = setInterval(() => {
      const videoElement = videoPlayerRef.current?.getVideoElement();
      if (!videoElement || !videoContainerRef.current) return;

      let x = 0.5;
      let y = 0.5;

      // Используем позицию мыши как временное решение
      // В реальном приложении здесь будет использоваться библиотека react-eye-tracking
      if (mousePositionRef.current) {
        x = mousePositionRef.current.x;
        y = mousePositionRef.current.y;
      }

      // Ограничиваем координаты в пределах [0, 1]
      x = Math.max(0, Math.min(1, x));
      y = Math.max(0, Math.min(1, y));

      const gazePoint: GazePoint = {
        x,
        y,
        timestamp: Date.now(),
        videoTime: videoElement.currentTime,
      };

      // Логируем только координаты взгляда
      console.log(
        `Взгляд: x=${x.toFixed(3)}, y=${y.toFixed(
          3
        )}, время=${videoElement.currentTime.toFixed(2)}с`
      );

      // Принудительно запускаем видео, если оно еще не запущено
      if (videoElement.paused && videoElement.readyState >= 2) {
        videoElement.play().catch(() => {
          // Тихая ошибка
        });
      }

      setGazePoints((prev) => [...prev, gazePoint]);
    }, 100);
  };

  const stopEyeTracking = () => {
    if (gazeCollectionIntervalRef.current) {
      clearInterval(gazeCollectionIntervalRef.current);
      gazeCollectionIntervalRef.current = null;
    }
    setIsEyeTrackingActive(false);

    // Останавливаем камеру только при полном завершении
    // (не останавливаем здесь, так как может понадобиться для тепловой карты)
  };

  const handleCameraPermissionGranted = (stream: MediaStream) => {
    setCameraStream(stream);

    // Подключаем поток к видео элементу для отслеживания
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = stream;
      cameraVideoRef.current.play().catch(() => {
        // Тихая ошибка
      });
    }

    setState("calibration");
  };

  const handleCameraPermissionDenied = () => {
    setUploadError(
      "Для отслеживания взгляда необходим доступ к камере. Пожалуйста, разрешите доступ и попробуйте снова."
    );
    setState("ready");
  };

  const handleStartWatching = () => {
    if (!videoURL) {
      setUploadError(
        "Видео не загружено. Пожалуйста, загрузите видео сначала."
      );
      return;
    }

    if (!isSocketConnected) {
      setUploadError(
        "Соединение с сервером не установлено. Пожалуйста, подождите."
      );
      return;
    }

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setUploadError("Соединение с сервером не готово. Пожалуйста, подождите.");
      return;
    }

    // Сначала запрашиваем доступ к камере
    setState("cameraPermission");
    return;

    // Этот код не выполняется, так как выше есть return
    // video_start отправляется в handleCalibrationComplete

    if (screenshotTriggers.length === 0 && videoDurationRef.current > 0) {
      const triggers = generateScreenshotTriggers(videoDurationRef.current);
      setScreenshotTriggers(triggers);
    }
  };

  const handleVideoEnd = () => {
    // Останавливаем отслеживание взгляда
    stopEyeTracking();

    // Отправляем video_end
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const videoEndMessage = { type: "video_end" };
      wsRef.current.send(JSON.stringify(videoEndMessage));
    }

    setState("finished");
  };

  const handleGenerateReport = async () => {
    setIsReportGenerating(true);

    setTimeout(() => {
      setIsReportGenerating(false);
      setState("reportGenerated");
    }, 2000);
  };

  const handleSaveReport = async () => {
    alert("Отчет успешно сохранен!");
  };
  const handleScreenshot = (screenshot: any) => {
    setCapturedScreenshots((prev) => {
      const updated = [...prev, screenshot];
      return updated;
    });
  };

  const handleReset = () => {
    // Останавливаем отслеживание взгляда
    stopEyeTracking();

    // Останавливаем камеру
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
        // Трек камеры остановлен
      });
      setCameraStream(null);
    }

    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }

    // Закрываем WebSocket соединение
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (videoURL) {
      URL.revokeObjectURL(videoURL);
    }
    setVideoFile(null);
    setVideoURL(null);
    setUploadedVideoId(null);
    uploadedVideoIdRef.current = null;
    setUploadedVideoUrl(null);
    setUploadError(null);
    setIsSocketConnected(false);
    setIsReportGenerating(false);
    setIsTracking(false);
    setIsCalibrated(false);
    setGazePoints([]);
    setIsEyeTrackingActive(false);
    setState("upload");
    setScreenshotTriggers([]);
    setCapturedScreenshots([]);
    videoDurationRef.current = 0;
  };

  useEffect(() => {
    return () => {
      // Останавливаем отслеживание взгляда
      stopEyeTracking();

      // Останавливаем камеру
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }

      // Отменяем переподключение при размонтировании
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Закрываем WebSocket при размонтировании
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (videoURL) {
        URL.revokeObjectURL(videoURL);
      }
    };
  }, [videoURL, cameraStream]);

  // Проверяем наличие данных на графике
  const hasChartData = (() => {
    if (!lastMessage) {
      return false;
    }

    const channels = lastMessage?.data?.channels || lastMessage?.channels;
    if (!channels) {
      return false;
    }

    const channelKeys = Object.keys(channels);
    if (channelKeys.length === 0) {
      return false;
    }

    // Проверяем, есть ли хотя бы один канал с данными mind
    const hasValidData = channelKeys.some((key) => {
      const channel = channels[key];
      return (
        channel?.mind?.relative_attention !== undefined ||
        channel?.mind?.relative_relaxation !== undefined
      );
    });

    return hasValidData;
  })();

  // Индикатор записи должен показываться только если:
  // 1. WebSocket подключен
  // 2. Есть данные на графике (приходят данные от устройства)
  const shouldShowTrackingIndicator =
    state === "watching" && isSocketConnected && hasChartData;

  // Отладочная информация убрана

  return (
    <div className={styles.analysisContainer}>
      <div className={styles.analysis}>
        <div className={styles.headerWithIndicator}>
          <h1>Анализ активности</h1>
          {shouldShowTrackingIndicator && (
            <div className={styles.trackingIndicator}>
              <span className={styles.trackingDot}></span>
              <span>Идет запись состояния</span>
            </div>
          )}
          {state === "watching" && !shouldShowTrackingIndicator && (
            <div className={styles.trackingWarning}>
              {uploadError ? (
                <>
                  <span className={styles.warningIcon}>❌</span>
                  <span>Запись не идет: {uploadError}</span>
                </>
              ) : !isSocketConnected ? (
                <>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Запись не идет: WebSocket не подключен</span>
                </>
              ) : !hasChartData ? (
                <>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Запись не идет: нет данных от устройства BrainBit</span>
                </>
              ) : (
                <>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Запись не идет: ожидание подключения устройства</span>
                </>
              )}
            </div>
          )}
          {state === "watching" && (
            <button
              className={styles.stopButton}
              onClick={handleReset}
              title="Остановить просмотр"
            >
              Остановить
            </button>
          )}
        </div>

        {state === "upload" && (
          <div className={styles.uploadSection}>
            <p className={styles.uploadPrompt}>Загрузите видео файл</p>
            <div className={styles.uploadWrapper}>
              <UploadFile onFileSelect={handleFileSelect} />
            </div>
            {isUploading && (
              <p className={styles.uploadStatus}>
                Загружаем видео на сервер...
              </p>
            )}
            {uploadError && <p className={styles.uploadError}>{uploadError}</p>}
          </div>
        )}

        {state === "ready" && (
          <div className={styles.readySection}>
            <div className={styles.connectionStatus}>
              {isSocketConnected ? (
                <div className={styles.statusConnected}>
                  <span className={styles.statusDot}></span>
                  Соединение с сервером установлено
                </div>
              ) : (
                <div className={styles.statusConnecting}>
                  <span className={styles.statusDot}></span>
                  Подключение к серверу...
                </div>
              )}
              {uploadError && (
                <div
                  className={styles.uploadError}
                  style={{ marginTop: "1rem" }}
                >
                  {uploadError}
                  <button
                    onClick={connectToSocket}
                    style={{
                      marginLeft: "1rem",
                      padding: "0.5rem 1rem",
                      background: "var(--purple-500)",
                      color: "white",
                      border: "none",
                      borderRadius: "0.25rem",
                      cursor: "pointer",
                    }}
                  >
                    Повторить подключение
                  </button>
                </div>
              )}
            </div>

            {videoFile && (
              <div className={styles.videoInfo}>
                <p>Файл: {videoFile.name}</p>
                <p>Размер: {(videoFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            {uploadedVideoId && (
              <div className={styles.videoInfo}>
                <p>ID видео: {uploadedVideoId}</p>
                {uploadedVideoUrl && <p>Ссылка: {uploadedVideoUrl}</p>}
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                className={styles.startButton}
                onClick={handleStartWatching}
                disabled={!isSocketConnected || isUploading}
              >
                Начать просмотр
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Загрузить другое видео
              </button>
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>
          </div>
        )}

        {state === "cameraPermission" && (
          <CameraPermission
            onPermissionGranted={handleCameraPermissionGranted}
            onPermissionDenied={handleCameraPermissionDenied}
            onCancel={handleCalibrationCancel}
          />
        )}

        {state === "calibration" && (
          <EyeTrackingCalibration
            onCalibrationComplete={handleCalibrationComplete}
            onCancel={handleCalibrationCancel}
          />
        )}

        {state === "watching" && (
          <div className={styles.watchingSection}>
            {!videoURL ? (
              <div className={styles.uploadError}>
                Ошибка: Видео не загружено. Пожалуйста, вернитесь и загрузите
                видео.
              </div>
            ) : (
              <>
                <div
                  className={styles.videoPlayerContainer}
                  ref={videoContainerRef}
                >
                  <VideoPlayer
                    ref={videoPlayerRef}
                    videoURL={videoURL}
                    triggers={screenshotTriggers}
                    autoCapture={false}
                    autoPlay={true}
                    showManualCapture={false}
                    onVideoEnd={handleVideoEnd}
                    onScreenshot={handleScreenshot}
                  />
                  {/* Принудительно запускаем видео после калибровки */}
                  {state === "watching" && videoPlayerRef.current && (
                    <VideoAutoPlayHelper
                      videoPlayerRef={videoPlayerRef}
                      isCalibrated={isCalibrated}
                    />
                  )}
                  {/* Скрытое видео с камеры для отслеживания взгляда */}
                  {cameraStream && (
                    <video
                      ref={cameraVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        position: "absolute",
                        width: "1px",
                        height: "1px",
                        opacity: 0,
                        pointerEvents: "none",
                        zIndex: -1,
                      }}
                    />
                  )}
                  {isEyeTrackingActive && (
                    <div className={styles.eyeTrackingIndicator}>
                      <span className={styles.eyeTrackingDot}></span>
                      <span>Отслеживание взгляда активно</span>
                      {cameraStream && (
                        <span
                          style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
                        >
                          (Камера:{" "}
                          {cameraStream.getVideoTracks()[0]?.readyState ||
                            "неизвестно"}
                          )
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Скриншоты с горизонтальным скроллом */}
                {capturedScreenshots.length > 0 ? (
                  <div className={styles.screenshotsScrollContainer}>
                    <h3 className={styles.screenshotsTitle}>
                      Скриншоты ({capturedScreenshots.length})
                    </h3>
                    <div className={styles.screenshotsScroll}>
                      {capturedScreenshots.map((screenshot) => (
                        <div
                          key={screenshot.id}
                          className={styles.screenshotItem}
                        >
                          <div className={styles.screenshotImage}>
                            <img
                              src={screenshot.image}
                              alt={`Screenshot at ${screenshot.formattedTime}`}
                            />
                          </div>
                          <div className={styles.screenshotTime}>
                            {screenshot.formattedTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "1rem",
                      color: "var(--profile-text-secondary)",
                      fontSize: "0.9rem",
                    }}
                  >
                    Скриншоты появятся здесь при обнаружении изменений состояния
                  </div>
                )}

                {/* Уменьшенный график концентрации под скриншотами */}
                <div className={styles.chartContainerSmall}>
                  <ConcentrationEngagementChart />
                </div>

                {uploadError && (
                  <div
                    className={styles.uploadError}
                    style={{ marginTop: "1rem" }}
                  >
                    {uploadError}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {state === "finished" && (
          <div className={styles.finishedSection}>
            <div className={styles.videoPlayerContainer}>
              {videoURL && (
                <>
                  <div className={styles.videoWithHeatmap}>
                    <VideoPlayer
                      videoURL={videoURL}
                      triggers={screenshotTriggers}
                      autoCapture={false}
                      autoPlay={false}
                      showManualCapture={false}
                      onVideoEnd={handleVideoEnd}
                      onScreenshot={handleScreenshot}
                    />
                    {gazePoints.length > 0 && (
                      <div className={styles.heatmapOverlay}>
                        <Heatmap
                          gazePoints={gazePoints}
                          width={videoDimensions.width}
                          height={videoDimensions.height}
                          intensity={0.7}
                        />
                      </div>
                    )}
                  </div>
                  {gazePoints.length > 0 && (
                    <div className={styles.heatmapInfo}>
                      <p>
                        Тепловая карта показывает области, на которые вы чаще
                        всего смотрели во время просмотра видео
                      </p>
                      <p className={styles.heatmapStats}>
                        Всего зафиксировано точек взгляда: {gazePoints.length}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <h3>Общее время</h3>
                <p>120 часов</p>
              </div>
              <div className={styles.statItem}>
                <h3>Завершенные задачи</h3>
                <p>42</p>
              </div>
              <div className={styles.statItem}>
                <h3>Уровень вовлеченности</h3>
                <p>85%</p>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                className={styles.generateButton}
                onClick={handleGenerateReport}
                disabled={isReportGenerating}
              >
                {isReportGenerating
                  ? "Генерация отчета..."
                  : "Сгенерировать отчет"}
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Загрузить новое видео
              </button>
            </div>
          </div>
        )}

        {state === "reportGenerated" && (
          <div className={styles.reportSection}>
            <div className={styles.reportHeader}>
              <h2>Отчет сгенерирован</h2>
              <p>Теперь вы можете задать вопросы о результатах анализа</p>
            </div>

            {/* Тепловая карта */}
            {gazePoints.length > 0 && (
              <div className={styles.heatmapSection}>
                <h3>Тепловая карта взгляда</h3>
                <p className={styles.heatmapDescription}>
                  Визуализация областей видео, на которые вы чаще всего смотрели
                </p>
                <div className={styles.heatmapContainer}>
                  <div className={styles.videoWithHeatmap}>
                    {videoURL && (
                      <div className={styles.videoWrapper}>
                        <VideoPlayer
                          videoURL={videoURL}
                          triggers={screenshotTriggers}
                          autoCapture={false}
                          autoPlay={false}
                          showManualCapture={false}
                          onVideoEnd={handleVideoEnd}
                          onScreenshot={handleScreenshot}
                        />
                        <div className={styles.heatmapOverlay}>
                          <Heatmap
                            gazePoints={gazePoints}
                            width={videoDimensions.width}
                            height={videoDimensions.height}
                            intensity={0.7}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={styles.heatmapInfo}>
                    <p className={styles.heatmapStats}>
                      Всего зафиксировано точек взгляда: {gazePoints.length}
                    </p>
                    <p className={styles.heatmapLegend}>
                      <span className={styles.legendItem}>
                        <span
                          className={styles.legendColor}
                          style={{ backgroundColor: "rgba(0, 0, 255, 0.5)" }}
                        ></span>
                        Низкая частота
                      </span>
                      <span className={styles.legendItem}>
                        <span
                          className={styles.legendColor}
                          style={{ backgroundColor: "rgba(255, 0, 0, 0.5)" }}
                        ></span>
                        Высокая частота
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <h3>Общее время</h3>
                <p>120 часов</p>
              </div>
              <div className={styles.statItem}>
                <h3>Завершенные задачи</h3>
                <p>42</p>
              </div>
              <div className={styles.statItem}>
                <h3>Уровень вовлеченности</h3>
                <p>85%</p>
              </div>
            </div>

            {/* Скриншоты с максимальными активностями */}
            {capturedScreenshots.length > 0 && (
              <div className={styles.screenshotsSection}>
                <h3>Скриншоты с активностями ({capturedScreenshots.length})</h3>
                <div className={styles.screenshotsGrid}>
                  {capturedScreenshots.map((screenshot) => (
                    <div key={screenshot.id} className={styles.screenshotCard}>
                      <div className={styles.screenshotImage}>
                        <img
                          src={screenshot.image}
                          alt={`Screenshot at ${screenshot.formattedTime}`}
                        />
                        <div className={styles.screenshotTime}>
                          {screenshot.formattedTime}
                        </div>
                      </div>
                      <div className={styles.screenshotInfo}>
                        <div className={styles.screenshotTrigger}>
                          {screenshot.trigger.type ===
                            "concentration_increase" && "🧠"}
                          {screenshot.trigger.type === "engagement_increase" &&
                            "❤️"}
                          {screenshot.trigger.type === "stress_peak" && "⚠️"}
                          {screenshot.trigger.type === "attention_peak" && "📈"}
                          <span>{screenshot.trigger.message || "Событие"}</span>
                        </div>
                        {screenshot.trigger.value && (
                          <div className={styles.screenshotValue}>
                            Значение: {screenshot.trigger.value}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button className={styles.saveButton} onClick={handleSaveReport}>
                Сохранить отчет
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Начать заново
              </button>
            </div>
          </div>
        )}
      </div>

      {state === "reportGenerated" && (
        <div className={styles.chat}>
          <ChatMessagerComponent />
        </div>
      )}
    </div>
  );
}

export default Analysis;
