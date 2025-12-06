import { useState, useEffect, useRef } from "react";
import ChatMessagerComponent from "../../../../core/components/ChatMessagerComponent/ChatMessagerComponent";
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators";
import ConcentrationEngagementChart from "../../modules/graphics/KeyIndicators/components/ConcentrationEngagementChart/ConcentrationEngagementChart";
import UploadFile from "../../../../core/components/UploadFile/UploadFile";
import VideoPlayer, {
  type ScreenshotTrigger,
  type VideoPlayerRef,
} from "../../../../core/components/VideoPlayer/VideoPlayer";
import { uploadVideo, uploadPhoto } from "../../../../api/files";
import { useUserStore } from "../../../../store/userStore";
import { useWebSocketStore } from "../../../../store/websocketStore";
import styles from "./Analysis.module.scss";

type AnalysisState =
  | "upload"
  | "ready"
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
  const videoDurationRef = useRef<number>(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const uploadedVideoIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        console.log("Ответ от сервера при загрузке видео:", response);
        const data = response?.data;
        console.log("Данные из ответа:", data);

        if (data?.id) {
          console.log("Устанавливаем uploadedVideoId:", data.id);
          setUploadedVideoId(data.id);
          uploadedVideoIdRef.current = data.id; // Обновляем ref
        } else {
          console.error("ID видео не найден в ответе сервера:", data);
        }

        if (data?.url || data?.video_url) {
          setUploadedVideoUrl(data.url || data.video_url);
        }

        setState("ready");
        connectToSocket();
      } catch (error) {
        console.error("Ошибка загрузки видео", error);
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
      console.error("Нет токена для подключения к WebSocket");
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
              console.error("Токен истек!");
              setUploadError(
                "Токен авторизации истек. Пожалуйста, войдите заново."
              );
              return;
            }
            console.log(
              "Токен действителен до:",
              new Date(expirationTime).toLocaleString()
            );
          }
        }
      } catch (e) {
        console.warn("Не удалось проверить токен:", e);
      }

      // Используем URL из требований: ws://5.129.252.186:3000/ws/client?token={access_token}
      const host = import.meta.env.VITE_WS_HOST || "5.129.252.186";
      const port = import.meta.env.VITE_WS_PORT || "3000";
      const wsUrl = `ws://${host}:${port}/ws/client?token=${encodeURIComponent(
        token
      )}`;

      console.log("Подключение к WebSocket:", wsUrl.replace(token, "***"));
      console.log("Токен длина:", token.length);
      console.log("Токен первые 10 символов:", token.substring(0, 10));

      const ws = new WebSocket(wsUrl);
      let connectionTimeout: NodeJS.Timeout | null = null;

      // Таймаут для соединения (10 секунд)
      connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error("Таймаут подключения к WebSocket");
          ws.close();
          setIsSocketConnected(false);
          setUploadError(
            "Таймаут подключения к серверу. Проверьте интернет-соединение."
          );
        }
      }, 10000);

      ws.onopen = () => {
        console.log("WebSocket подключен успешно");
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
          console.log("Получено сообщение от WebSocket:", data);

          // Логирование формата eeg_sample для отладки
          if (data.type === "eeg_sample") {
            console.log("EEG Sample структура:", {
              hasData: !!data.data,
              hasChannels: !!data.data?.channels,
              channelKeys: data.data?.channels
                ? Object.keys(data.data.channels)
                : [],
              firstChannel: data.data?.channels
                ? Object.keys(data.data.channels)[0]
                : null,
              firstChannelData: data.data?.channels
                ? data.data.channels[Object.keys(data.data.channels)[0]]
                : null,
            });
          }

          if (data.type === "video_tracking_started") {
            setIsTracking(true);
            console.log("Отслеживание видео начато");
          } else if (data.type === "video_tracking_ended") {
            setIsTracking(false);
            console.log("Отслеживание видео завершено");
          } else if (data.type === "request_screenshot") {
            // Сервер запрашивает скриншот
            const timestamp = data.timestamp;
            console.log("Запрос скриншота на timestamp:", timestamp);
            console.log("Состояние для скриншота:", {
              hasVideoPlayerRef: !!videoPlayerRef.current,
              uploadedVideoId,
              videoURL: !!videoURL,
              wsReady: wsRef.current?.readyState === WebSocket.OPEN,
            });

            if (!videoPlayerRef.current) {
              console.error(
                "videoPlayerRef.current отсутствует, скриншот не может быть создан"
              );
              return;
            }

            // Создаем скриншот в любом случае (для отображения пользователю)
            // captureScreenshot() автоматически вызовет onScreenshot callback,
            // который добавит скриншот в capturedScreenshots
            const imageData = videoPlayerRef.current.captureScreenshot();
            console.log("Результат captureScreenshot:", {
              hasImageData: !!imageData,
              imageDataLength: imageData?.length || 0,
              currentScreenshotsCount: capturedScreenshots.length,
            });

            if (!imageData) {
              console.error("Не удалось создать скриншот - imageData пустой");
              console.error("Проверка video элемента:", {
                hasVideoElement: !!videoPlayerRef.current.getVideoElement(),
                videoElement: videoPlayerRef.current.getVideoElement(),
                currentTime: videoPlayerRef.current.getCurrentTime(),
              });
              return;
            }

            console.log(
              "Скриншот успешно создан, imageData длина:",
              imageData.length
            );

            // Используем ref для получения актуального значения uploadedVideoId
            // (чтобы избежать проблемы с замыканием в обработчике WebSocket)
            const currentVideoId =
              uploadedVideoIdRef.current || uploadedVideoId;

            console.log("Проверка uploadedVideoId:", {
              fromRef: uploadedVideoIdRef.current,
              fromState: uploadedVideoId,
              currentVideoId,
            });

            // Отправляем на сервер только если есть uploadedVideoId
            if (currentVideoId) {
              try {
                console.log(
                  "=== Начинаем загрузку фото на сервер через /v1/photos ==="
                );
                console.log("imageData длина:", imageData.length);
                console.log(
                  "uploadedVideoId (из ref):",
                  uploadedVideoIdRef.current
                );
                console.log("uploadedVideoId (из state):", uploadedVideoId);
                console.log("currentVideoId:", currentVideoId);

                // Загружаем фото на сервер через /v1/photos
                const photoResponse = await uploadPhoto(
                  imageData,
                  `screenshot-${Date.now()}.png`
                );

                console.log("=== Ответ от сервера при загрузке фото ===");
                console.log("Полный ответ:", photoResponse);
                console.log("photoResponse.data:", photoResponse?.data);
                console.log(
                  "photoResponse.data?.url:",
                  photoResponse?.data?.url
                );

                // Извлекаем URL из ответа
                // Сервер возвращает {"url": "..."}
                const photoData = photoResponse?.data;
                let screenshotUrl = null;

                if (photoData) {
                  // Проверяем разные возможные форматы ответа
                  screenshotUrl =
                    photoData.url || photoData.photo_url || photoData.image_url;
                }

                if (!screenshotUrl) {
                  console.error("❌ URL не найден в ответе сервера!", {
                    photoResponse,
                    photoData,
                    responseKeys: photoResponse
                      ? Object.keys(photoResponse)
                      : [],
                    dataKeys: photoData ? Object.keys(photoData) : [],
                  });
                  throw new Error("URL не найден в ответе сервера");
                }

                console.log("=== Photo URL получен ===");
                console.log("screenshotUrl:", screenshotUrl);

                // Отправляем video_frame на сервер
                const videoFrameMessage = {
                  type: "video_frame",
                  timestamp: timestamp.toString(),
                  video_id: currentVideoId,
                  screenshot_url: screenshotUrl,
                };

                console.log("=== Отправка video_frame в WebSocket ===");
                console.log("videoFrameMessage:", videoFrameMessage);
                console.log("WebSocket readyState:", wsRef.current?.readyState);

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                  wsRef.current.send(JSON.stringify(videoFrameMessage));
                  console.log(
                    "✅ video_frame успешно отправлен:",
                    videoFrameMessage
                  );
                } else {
                  console.error(
                    "❌ WebSocket не готов для отправки video_frame",
                    {
                      readyState: wsRef.current?.readyState,
                      wsExists: !!wsRef.current,
                    }
                  );
                }
              } catch (error) {
                console.error("❌ Ошибка загрузки фото:", error);
                if (error instanceof Error) {
                  console.error("Сообщение об ошибке:", error.message);
                  console.error("Стек ошибки:", error.stack);
                }
              }
            } else {
              console.warn(
                "⚠️ uploadedVideoId отсутствует, скриншот создан для отображения, но не отправлен на сервер"
              );
              console.warn("Текущее состояние:", {
                uploadedVideoId,
                state,
                videoFile: !!videoFile,
              });
            }
          } else if (data.type === "error") {
            console.error("Ошибка от сервера:", data.message);
            setUploadError(`Ошибка сервера: ${data.message}`);
          }
        } catch (error) {
          console.error("Ошибка парсинга сообщения:", error, event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket ошибка:", error);
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
        console.log("WebSocket закрыт:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });

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
          console.error("Ошибка закрытия WebSocket:", errorMessage);

          // Автоматическое переподключение во время просмотра видео
          if (state === "watching" && event.code === 1011) {
            console.log(
              "Попытка переподключения WebSocket после ошибки 1011..."
            );
            // Отменяем предыдущее переподключение, если оно было запланировано
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              if (state === "watching" && !isSocketConnected && token) {
                console.log("Переподключаемся к WebSocket...");
                connectToSocket();
              }
              reconnectTimeoutRef.current = null;
            }, 2000); // Переподключение через 2 секунды
          }

          if (state === "ready" || state === "watching") {
            setUploadError(errorMessage);
          }
        } else if (event.code === 1005) {
          // Код 1005 означает "No Status Received" - это может быть нормальное закрытие
          console.log("WebSocket закрыт без кода статуса (1005)");
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Ошибка создания WebSocket:", error);
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

  const handleStartWatching = () => {
    console.log("handleStartWatching вызван", {
      videoURL: !!videoURL,
      isSocketConnected,
      wsReadyState: wsRef.current?.readyState,
      uploadedVideoId,
    });

    if (!videoURL) {
      console.error("videoURL отсутствует");
      setUploadError(
        "Видео не загружено. Пожалуйста, загрузите видео сначала."
      );
      return;
    }

    if (!isSocketConnected) {
      console.error("WebSocket не подключен");
      setUploadError(
        "Соединение с сервером не установлено. Пожалуйста, подождите."
      );
      return;
    }

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error("WebSocket не в состоянии OPEN", wsRef.current?.readyState);
      setUploadError("Соединение с сервером не готово. Пожалуйста, подождите.");
      return;
    }

    setState("watching");

    // Отправляем video_start
    const videoStartMessage = { type: "video_start" };
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(videoStartMessage));
        console.log("Отправлен video_start:", videoStartMessage);
      } else {
        console.error("WebSocket не готов для отправки сообщения", {
          wsExists: !!wsRef.current,
          readyState: wsRef.current?.readyState,
        });
        setUploadError(
          "WebSocket соединение потеряно. Пожалуйста, перезагрузите страницу."
        );
      }
    } catch (error) {
      console.error("Ошибка при отправке video_start:", error);
      setUploadError("Не удалось отправить команду начала просмотра.");
    }

    if (screenshotTriggers.length === 0 && videoDurationRef.current > 0) {
      const triggers = generateScreenshotTriggers(videoDurationRef.current);
      setScreenshotTriggers(triggers);
    }
  };

  const handleVideoEnd = () => {
    // Отправляем video_end
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const videoEndMessage = { type: "video_end" };
      wsRef.current.send(JSON.stringify(videoEndMessage));
      console.log("Отправлен video_end");
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
    console.log("Сохранение отчета:", {
      screenshots: capturedScreenshots,
      stats: {
        totalTime: "120 часов",
        completedTasks: 42,
        engagement: "85%",
      },
    });

    alert("Отчет успешно сохранен!");
  };
  const handleScreenshot = (screenshot: any) => {
    console.log("handleScreenshot вызван с:", {
      id: screenshot?.id,
      timestamp: screenshot?.timestamp,
      formattedTime: screenshot?.formattedTime,
      hasImage: !!screenshot?.image,
      imageLength: screenshot?.image?.length || 0,
    });
    setCapturedScreenshots((prev) => {
      const updated = [...prev, screenshot];
      console.log(
        "Обновлен capturedScreenshots, новый размер:",
        updated.length
      );
      return updated;
    });
    console.log("Скриншот добавлен в состояние");
  };

  const handleReset = () => {
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
    setState("upload");
    setScreenshotTriggers([]);
    setCapturedScreenshots([]);
    videoDurationRef.current = 0;
  };

  useEffect(() => {
    return () => {
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
  }, [videoURL]);

  // Проверяем наличие данных на графике
  const hasChartData = (() => {
    if (!lastMessage) {
      console.log("hasChartData: lastMessage отсутствует");
      return false;
    }

    // Логируем структуру для отладки eeg_sample
    if (lastMessage.type === "eeg_sample") {
      console.log("Проверка eeg_sample данных:", {
        hasData: !!lastMessage.data,
        hasChannels: !!lastMessage.data?.channels,
        hasDirectChannels: !!lastMessage.channels,
        structure: {
          type: lastMessage.type,
          data: lastMessage.data ? "present" : "missing",
          channels: lastMessage.data?.channels ? "present" : "missing",
        },
      });
    }

    const channels = lastMessage?.data?.channels || lastMessage?.channels;
    if (!channels) {
      console.log("hasChartData: channels не найдены в", {
        hasData: !!lastMessage.data,
        hasChannels: !!lastMessage.channels,
        messageKeys: Object.keys(lastMessage),
      });
      return false;
    }

    const channelKeys = Object.keys(channels);
    if (channelKeys.length === 0) {
      console.log("hasChartData: channels пустой объект");
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

    if (!hasValidData) {
      console.log("hasChartData: нет каналов с mind данными", {
        channelKeys,
        firstChannel: channels[channelKeys[0]],
      });
    }

    return hasValidData;
  })();

  // Индикатор записи должен показываться только если:
  // 1. WebSocket подключен
  // 2. Есть данные на графике (приходят данные от устройства)
  const shouldShowTrackingIndicator =
    state === "watching" && isSocketConnected && hasChartData;

  // Отладочная информация (можно убрать в продакшене)
  console.log("Analysis render:", {
    state,
    videoURL: !!videoURL,
    isSocketConnected,
    isTracking,
    uploadedVideoId,
    hasChartData,
    shouldShowTrackingIndicator,
    capturedScreenshotsCount: capturedScreenshots.length,
  });

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

        {state === "watching" && (
          <div className={styles.watchingSection}>
            {!videoURL ? (
              <div className={styles.uploadError}>
                Ошибка: Видео не загружено. Пожалуйста, вернитесь и загрузите
                видео.
              </div>
            ) : (
              <>
                <div className={styles.videoPlayerContainer}>
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
                <VideoPlayer
                  videoURL={videoURL}
                  triggers={screenshotTriggers}
                  autoCapture={false}
                  autoPlay={false}
                  showManualCapture={false}
                  onVideoEnd={handleVideoEnd}
                  onScreenshot={handleScreenshot}
                />
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
