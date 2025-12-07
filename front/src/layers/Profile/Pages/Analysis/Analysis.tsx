import { useState, useEffect, useRef, useCallback } from "react";
import { EyeTracking } from "react-eye-tracking/dist/index.js";
import "react-eye-tracking/dist/index.css";
import ChatMessagerComponent from "../../../../core/components/ChatMessagerComponent/ChatMessagerComponent";
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators";
import ConcentrationEngagementChart from "../../modules/graphics/KeyIndicators/components/ConcentrationEngagementChart/ConcentrationEngagementChart";
import UploadFile from "../../../../core/components/UploadFile/UploadFile";
import VideoPlayer, {
  type ScreenshotTrigger,
  type VideoPlayerRef,
} from "../../../../core/components/VideoPlayer/VideoPlayer";
import { uploadVideo, uploadPhoto, analyzeEEG } from "../../../../api/files";
import { useUserStore } from "../../../../store/userStore";
import { useWebSocketStore } from "../../../../store/websocketStore";
import { useChatAssistantStore } from "../../../../store/chatAssistantStore";
import styles from "./Analysis.module.scss";

type AnalysisState =
  | "upload"
  | "ready"
  | "watching"
  | "finished"
  | "reportGenerated";

type CameraPermissionStatus = "unknown" | "pending" | "granted" | "denied";

type GazePoint = {
  viewportX: number;
  viewportY: number;
  relativeX: number;
  relativeY: number;
  timestamp: number;
  videoTime: number;
};

declare global {
  interface Window {
    webgazer?: any;
  }
}

function Analysis() {
  const { token } = useUserStore();
  const { lastMessage } = useWebSocketStore();
  const { addMessage } = useChatAssistantStore();
  const [state, setState] = useState<AnalysisState>("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isReportGenerating, setIsReportGenerating] = useState(false);
  const [reportAnalysis, setReportAnalysis] = useState<string | null>(null);
  const [screenshotTriggers, setScreenshotTriggers] = useState<
    ScreenshotTrigger[]
  >([]);
  const [capturedScreenshots, setCapturedScreenshots] = useState<any[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [eyeTrackingEnabled, setEyeTrackingEnabled] = useState(true);
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionStatus>("unknown");
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibrationCompleted, setCalibrationCompleted] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [gazeIndicator, setGazeIndicator] = useState<GazePoint | null>(null);
  const videoDurationRef = useRef<number>(0);
  const videoPlayerRef = useRef<VideoPlayerRef>(null);
  const videoOverlayRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const uploadedVideoIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestGazeRef = useRef<GazePoint | null>(null);
  const gazeHistoryRef = useRef<GazePoint[]>([]);
  const gazeAnimationFrameRef = useRef<number | null>(null);

  const getHasCalibrationData = useCallback(() => {
    const points = window.webgazer?.getStoredPoints?.();
    if (!points) return false;
    if (Array.isArray(points)) {
      return points.length > 0;
    }
    if (typeof points === "object") {
      return Object.keys(points).length > 0;
    }
    return false;
  }, []);

  const requestCameraAccess =
    useCallback(async (): Promise<CameraPermissionStatus> => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setUploadError("Браузер не поддерживает доступ к камере.");
        setCameraPermission("denied");
        return "denied";
      }

      try {
        setCameraPermission("pending");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        setCameraPermission("granted");
        setUploadError(null);
        return "granted";
      } catch (error) {
        console.error("Не удалось получить доступ к камере", error);
        setCameraPermission("denied");
        setUploadError(
          "Доступ к камере не разрешен — тепловая карта и отслеживание взгляда не будут работать."
        );
        return "denied";
      }
    }, []);

  const startCalibration = useCallback(async () => {
    const permission =
      cameraPermission === "granted" ? "granted" : await requestCameraAccess();

    if (permission !== "granted") {
      setUploadError(
        "Без доступа к камере калибровка невозможна. Разрешите камеру или продолжите без тепловой карты."
      );
      return;
    }

    // Включаем отслеживание если еще не включено
    if (!eyeTrackingEnabled) {
      setEyeTrackingEnabled(true);
    }

    setShowCameraPreview(true);
    setCalibrationCompleted(false);
    setShowCalibration(true);
    setIsCalibrating(true);
    setUploadError(null);
  }, [cameraPermission, requestCameraAccess, eyeTrackingEnabled]);

  const handleGazeData = useCallback(
    (data: any) => {
      if (!eyeTrackingEnabled) return;
      if (!data || typeof data.x !== "number" || typeof data.y !== "number") {
        return;
      }

      const viewportX = data.x;
      const viewportY = data.y;
      const rect = videoOverlayRef.current?.getBoundingClientRect();

      let relativeX = -1;
      let relativeY = -1;

      if (rect) {
        relativeX = (viewportX - rect.left) / rect.width;
        relativeY = (viewportY - rect.top) / rect.height;
      }

      const sample: GazePoint = {
        viewportX,
        viewportY,
        relativeX,
        relativeY,
        timestamp: Date.now(),
        videoTime: videoPlayerRef.current?.getCurrentTime() || 0,
      };

      latestGazeRef.current = sample;

      if (state === "watching") {
        gazeHistoryRef.current.push(sample);
        if (gazeHistoryRef.current.length > 5000) {
          gazeHistoryRef.current.shift();
        }
      }

      if (gazeAnimationFrameRef.current) return;

      gazeAnimationFrameRef.current = requestAnimationFrame(() => {
        gazeAnimationFrameRef.current = null;

        const isInsideFrame =
          rect &&
          relativeX >= 0 &&
          relativeX <= 1 &&
          relativeY >= 0 &&
          relativeY <= 1;

        if (state === "watching" && isInsideFrame) {
          setGazeIndicator(sample);
        } else {
          setGazeIndicator(null);
        }
      });
    },
    [state, eyeTrackingEnabled]
  );

  useEffect(() => {
    if (!("permissions" in navigator)) return;

    const permissionApi = (navigator as any).permissions;
    if (!permissionApi?.query) return;

    permissionApi
      .query({ name: "camera" as PermissionName })
      .then((status: PermissionStatus) => {
        if (status.state === "granted") {
          setCameraPermission("granted");
        } else if (status.state === "denied") {
          setCameraPermission("denied");
        }
        status.onchange = () => {
          if (status.state === "granted") {
            setCameraPermission("granted");
          } else if (status.state === "denied") {
            setCameraPermission("denied");
          } else {
            setCameraPermission("unknown");
          }
        };
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (!showCalibration) {
      setIsCalibrating(false);
      const hasData = getHasCalibrationData();
      setCalibrationCompleted(hasData);
    }
  }, [showCalibration, getHasCalibrationData]);

  useEffect(() => {
    return () => {
      if (gazeAnimationFrameRef.current) {
        cancelAnimationFrame(gazeAnimationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state !== "watching") {
      setGazeIndicator(null);
    }
  }, [state]);

  // Останавливаем камеру при выходе из режима просмотра
  useEffect(() => {
    if (state !== "watching" && eyeTrackingEnabled) {
      if (window.webgazer) {
        try {
          window.webgazer.end();
        } catch (error) {
          console.error("Ошибка при остановке WebGazer:", error);
        }
      }
      setShowCameraPreview(false);
      setShowCalibration(false);
    }
  }, [state, eyeTrackingEnabled]);

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
      // Устанавливаем wsRef.current сразу после создания WebSocket
      wsRef.current = ws;
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
            // Используем timestamp из запроса, или текущее время видео, или Date.now() как fallback
            let timestamp = data.timestamp;

            // Если timestamp отсутствует, используем текущее время видео или текущее время
            if (timestamp === undefined || timestamp === null) {
              const videoTime = videoPlayerRef.current?.getCurrentTime();
              timestamp = videoTime ? Math.floor(videoTime * 1000) : Date.now();
              console.warn(
                "[SCREENSHOT REQUEST] timestamp отсутствует в запросе, используем fallback:",
                timestamp
              );
            }

            console.log(
              "🔵 [SCREENSHOT REQUEST] Получен запрос скриншота на timestamp:",
              timestamp,
              "тип:",
              typeof timestamp
            );

            // Используем ref для получения актуального значения uploadedVideoId
            const currentVideoIdFromRef = uploadedVideoIdRef.current;
            const currentVideoIdFromState = uploadedVideoId;

            console.log("[SCREENSHOT REQUEST] Состояние для скриншота:", {
              hasVideoPlayerRef: !!videoPlayerRef.current,
              uploadedVideoIdFromState: currentVideoIdFromState,
              uploadedVideoIdFromRef: currentVideoIdFromRef,
              videoURL: !!videoURL,
              wsReady: ws.readyState === WebSocket.OPEN,
              wsRefReady: wsRef.current?.readyState === WebSocket.OPEN,
              state,
              timestamp,
              timestampType: typeof timestamp,
            });

            if (!videoPlayerRef.current) {
              console.error(
                "❌ [SCREENSHOT REQUEST] videoPlayerRef.current отсутствует, скриншот не может быть создан"
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
            // Приоритет отдаем ref, так как он всегда актуален
            const currentVideoId =
              currentVideoIdFromRef || currentVideoIdFromState;

            console.log("Проверка uploadedVideoId:", {
              fromRef: uploadedVideoIdRef.current,
              fromState: uploadedVideoId,
              currentVideoId,
            });

            // Отправляем на сервер только если есть uploadedVideoId
            if (currentVideoId) {
              // Сохраняем timestamp в локальную переменную для использования в асинхронной функции
              const screenshotTimestamp = timestamp;

              // Выполняем асинхронную операцию без await в обработчике
              // чтобы не блокировать обработку других сообщений
              (async () => {
                try {
                  console.log(
                    "=== [SCREENSHOT] Начинаем загрузку фото на сервер через /v1/photos ==="
                  );
                  console.log(
                    "[SCREENSHOT] imageData длина:",
                    imageData.length
                  );
                  console.log(
                    "[SCREENSHOT] uploadedVideoId (из ref):",
                    uploadedVideoIdRef.current
                  );
                  console.log(
                    "[SCREENSHOT] uploadedVideoId (из state):",
                    uploadedVideoId
                  );
                  console.log("[SCREENSHOT] currentVideoId:", currentVideoId);
                  console.log(
                    "[SCREENSHOT] WebSocket состояние перед загрузкой:",
                    {
                      readyState: ws.readyState,
                      isOpen: ws.readyState === WebSocket.OPEN,
                    }
                  );

                  // Загружаем фото на сервер через /v1/photos
                  let photoResponse;
                  try {
                    photoResponse = await uploadPhoto(
                      imageData,
                      `screenshot-${Date.now()}.png`
                    );
                    console.log(
                      "[SCREENSHOT] ✅ Фото успешно загружено на сервер"
                    );
                  } catch (uploadError: any) {
                    console.error(
                      "[SCREENSHOT] ❌ Ошибка при загрузке фото:",
                      uploadError
                    );
                    // Логируем детали ошибки axios
                    if (uploadError?.response) {
                      console.error("[SCREENSHOT] Ошибка response:", {
                        status: uploadError.response.status,
                        statusText: uploadError.response.statusText,
                        data: uploadError.response.data,
                        headers: uploadError.response.headers,
                      });
                    }
                    if (uploadError?.request) {
                      console.error(
                        "[SCREENSHOT] Ошибка request:",
                        uploadError.request
                      );
                    }
                    if (uploadError?.message) {
                      console.error(
                        "[SCREENSHOT] Ошибка message:",
                        uploadError.message
                      );
                    }
                    throw uploadError;
                  }

                  console.log(
                    "=== [SCREENSHOT] Ответ от сервера при загрузке фото ==="
                  );
                  console.log("[SCREENSHOT] Полный ответ:", photoResponse);
                  console.log(
                    "[SCREENSHOT] photoResponse:",
                    JSON.stringify(photoResponse, null, 2)
                  );
                  console.log(
                    "[SCREENSHOT] photoResponse.data:",
                    photoResponse?.data
                  );
                  console.log(
                    "[SCREENSHOT] photoResponse.data?.url:",
                    photoResponse?.data?.url
                  );

                  // Извлекаем URL из ответа
                  // Сервер возвращает {"url": "..."} в response.data
                  // Но также проверяем, может быть ответ пришел напрямую
                  let screenshotUrl = null;

                  // Проверяем разные возможные форматы ответа
                  if (photoResponse?.data?.url) {
                    screenshotUrl = photoResponse.data.url;
                    console.log(
                      "[SCREENSHOT] URL найден в photoResponse.data.url"
                    );
                  } else if (photoResponse?.data?.photo_url) {
                    screenshotUrl = photoResponse.data.photo_url;
                    console.log(
                      "[SCREENSHOT] URL найден в photoResponse.data.photo_url"
                    );
                  } else if (photoResponse?.data?.image_url) {
                    screenshotUrl = photoResponse.data.image_url;
                    console.log(
                      "[SCREENSHOT] URL найден в photoResponse.data.image_url"
                    );
                  } else if (
                    photoResponse?.data &&
                    typeof photoResponse.data === "string"
                  ) {
                    // Возможно, ответ пришел как строка
                    screenshotUrl = photoResponse.data as string;
                    console.log(
                      "[SCREENSHOT] URL найден как строка в photoResponse.data"
                    );
                  }

                  if (screenshotUrl) {
                    console.log(
                      "[SCREENSHOT] ✅ Извлеченный screenshotUrl:",
                      screenshotUrl
                    );
                  } else {
                    console.error(
                      "[SCREENSHOT] ❌ URL не найден в ответе сервера!",
                      {
                        photoResponse,
                        photoResponseType: typeof photoResponse,
                        photoResponseData: photoResponse?.data,
                        photoResponseDataType: typeof photoResponse?.data,
                        responseKeys: photoResponse
                          ? Object.keys(photoResponse)
                          : [],
                        dataKeys: photoResponse?.data
                          ? Object.keys(photoResponse.data)
                          : [],
                        fullResponse: JSON.stringify(photoResponse, null, 2),
                      }
                    );
                    throw new Error("URL не найден в ответе сервера");
                  }

                  console.log("=== [SCREENSHOT] Photo URL получен ===");
                  console.log("[SCREENSHOT] screenshotUrl:", screenshotUrl);

                  // Проверяем состояние WebSocket после асинхронной загрузки фото
                  // так как за это время соединение могло закрыться
                  // Используем wsRef.current для получения актуальной ссылки на WebSocket
                  const currentWs = wsRef.current;

                  console.log(
                    "[SCREENSHOT] Проверка WebSocket после загрузки фото:",
                    {
                      wsReadyState: ws.readyState,
                      wsIsOpen: ws.readyState === WebSocket.OPEN,
                      wsRefReadyState: currentWs?.readyState,
                      wsRefIsOpen: currentWs?.readyState === WebSocket.OPEN,
                      wsSame: ws === currentWs,
                    }
                  );

                  // Проверяем оба WebSocket - локальный и из ref
                  // Используем тот, который открыт, или ref если он актуален
                  const wsToUse =
                    currentWs && currentWs.readyState === WebSocket.OPEN
                      ? currentWs
                      : ws.readyState === WebSocket.OPEN
                      ? ws
                      : null;

                  if (!wsToUse || wsToUse.readyState !== WebSocket.OPEN) {
                    console.error(
                      "[SCREENSHOT] ❌ WebSocket закрыт во время загрузки фото",
                      {
                        wsReadyState: ws.readyState,
                        wsRefReadyState: currentWs?.readyState,
                        wsStates: {
                          CONNECTING: WebSocket.CONNECTING,
                          OPEN: WebSocket.OPEN,
                          CLOSING: WebSocket.CLOSING,
                          CLOSED: WebSocket.CLOSED,
                        },
                      }
                    );
                    throw new Error(
                      "WebSocket соединение закрыто во время загрузки фото"
                    );
                  }

                  // Получаем текущее время видео для time_code
                  const currentVideoTime =
                    videoPlayerRef.current?.getCurrentTime() || 0;
                  const timeCode = Math.floor(currentVideoTime); // Таймкод в секундах (целое число)

                  console.log("[SCREENSHOT] Таймкод видео:", {
                    currentVideoTime,
                    timeCode,
                  });

                  const gazePositionPayload = latestGazeRef.current
                    ? {
                        viewport_x: latestGazeRef.current.viewportX,
                        viewport_y: latestGazeRef.current.viewportY,
                        relative_x: latestGazeRef.current.relativeX,
                        relative_y: latestGazeRef.current.relativeY,
                        video_time: latestGazeRef.current.videoTime,
                        captured_at: latestGazeRef.current.timestamp,
                      }
                    : undefined;

                  // Валидация данных перед отправкой
                  if (!screenshotTimestamp) {
                    console.error(
                      "[SCREENSHOT] screenshotTimestamp отсутствует:",
                      {
                        screenshotTimestamp,
                        originalTimestamp: timestamp,
                      }
                    );
                    throw new Error("timestamp отсутствует");
                  }
                  if (!currentVideoId) {
                    throw new Error("currentVideoId отсутствует");
                  }
                  if (!screenshotUrl) {
                    throw new Error("screenshotUrl отсутствует");
                  }

                  console.log(
                    "[SCREENSHOT] Используемый timestamp для отправки:",
                    {
                      screenshotTimestamp,
                      screenshotTimestampType: typeof screenshotTimestamp,
                      screenshotTimestampString: screenshotTimestamp.toString(),
                    }
                  );

                  // Отправляем video_frame на сервер
                  const videoFrameMessage = {
                    type: "video_frame",
                    timestamp: screenshotTimestamp.toString(),
                    video_id: currentVideoId,
                    screenshot_url: screenshotUrl,
                    time_code: timeCode,
                    gaze_position: gazePositionPayload,
                  };

                  console.log(
                    "=== [SCREENSHOT] Отправка video_frame в WebSocket ==="
                  );
                  console.log(
                    "[SCREENSHOT] videoFrameMessage:",
                    JSON.stringify(videoFrameMessage, null, 2)
                  );
                  console.log("[SCREENSHOT] Проверка данных:", {
                    hasTimestamp: !!screenshotTimestamp,
                    hasVideoId: !!currentVideoId,
                    hasScreenshotUrl: !!screenshotUrl,
                    hasTimeCode: timeCode !== undefined,
                  });
                  console.log("[SCREENSHOT] WebSocket для отправки:", {
                    wsToUseReadyState: wsToUse.readyState,
                    wsToUseIsOpen: wsToUse.readyState === WebSocket.OPEN,
                    wsToUseSameAsWs: wsToUse === ws,
                    wsToUseSameAsRef: wsToUse === wsRef.current,
                  });

                  // Используем актуальный WebSocket из проверки выше
                  try {
                    const messageString = JSON.stringify(videoFrameMessage);
                    console.log(
                      "[SCREENSHOT] Отправляем сообщение (длина):",
                      messageString.length
                    );
                    console.log(
                      "[SCREENSHOT] Сообщение для отправки:",
                      messageString.substring(0, 200) + "..."
                    );

                    wsToUse.send(messageString);

                    console.log(
                      "[SCREENSHOT] ✅ video_frame успешно отправлен:",
                      videoFrameMessage
                    );
                  } catch (sendError) {
                    console.error(
                      "[SCREENSHOT] ❌ Ошибка при отправке video_frame:",
                      sendError
                    );
                    if (sendError instanceof Error) {
                      console.error(
                        "[SCREENSHOT] Сообщение об ошибке:",
                        sendError.message
                      );
                      console.error(
                        "[SCREENSHOT] Стек ошибки:",
                        sendError.stack
                      );
                    }
                    throw sendError;
                  }
                } catch (error) {
                  console.error(
                    "[SCREENSHOT] ❌ Ошибка в процессе отправки скриншота:",
                    error
                  );
                  if (error instanceof Error) {
                    console.error(
                      "[SCREENSHOT] Сообщение об ошибке:",
                      error.message
                    );
                    console.error("[SCREENSHOT] Стек ошибки:", error.stack);
                  }
                  // Показываем ошибку пользователю
                  setUploadError(
                    `Ошибка отправки скриншота: ${
                      error instanceof Error
                        ? error.message
                        : "Неизвестная ошибка"
                    }`
                  );
                }
              })(); // Вызываем асинхронную функцию немедленно
            } else {
              console.warn(
                "[SCREENSHOT] ⚠️ uploadedVideoId отсутствует, скриншот создан для отображения, но не отправлен на сервер"
              );
              console.warn("[SCREENSHOT] Текущее состояние:", {
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
    } catch (error) {
      console.error("Ошибка создания WebSocket:", error);
      setIsSocketConnected(false);
      setUploadError(
        "Не удалось создать WebSocket соединение. Проверьте настройки браузера."
      );
    }
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

    // Калибровка теперь опциональна - можно смотреть видео без неё
    // Проверяем только если включено отслеживание взгляда
    if (eyeTrackingEnabled) {
      if (cameraPermission !== "granted") {
        // Предупреждаем, но не блокируем просмотр
        console.warn(
          "Доступ к камере не разрешен — тепловая карта и красный индикатор взгляда не будут построены."
        );
        // Не блокируем просмотр, просто предупреждаем
      }

      // Калибровка больше не обязательна - можно смотреть видео без неё
      // if (cameraPermission === "granted" && !calibrationCompleted) {
      //   setUploadError(
      //     "Пройдите калибровку: нажмите «Начать калибровку» и кликните по всем точкам 5 раз."
      //   );
      //   return;
      // }

      if (isCalibrating) {
        setUploadError(
          "Дождитесь завершения калибровки перед началом просмотра."
        );
        return;
      }
    }

    setShowCalibration(false);
    if (eyeTrackingEnabled) {
      setShowCameraPreview(true);
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

    // Сохраняем данные взгляда в localStorage для использования в отчете
    const currentVideoId = uploadedVideoIdRef.current || uploadedVideoId;
    if (currentVideoId && gazeHistoryRef.current.length > 0) {
      try {
        // Сохраняем только валидные точки (relativeX и relativeY от 0 до 1)
        const validGazePoints = gazeHistoryRef.current.filter(
          (p) =>
            p.relativeX >= 0 &&
            p.relativeX <= 1 &&
            p.relativeY >= 0 &&
            p.relativeY <= 1
        );

        if (validGazePoints.length > 0) {
          localStorage.setItem(
            `gaze_data_${currentVideoId}`,
            JSON.stringify(validGazePoints)
          );
          console.log(
            `[GAZE] Сохранено ${validGazePoints.length} точек взгляда для video_id: ${currentVideoId}`
          );
        }
      } catch (err) {
        console.error("[GAZE] Ошибка при сохранении данных взгляда:", err);
      }
    }
  };

  const handleGenerateReport = async () => {
    // Используем ref для получения актуального значения uploadedVideoId
    const currentVideoId = uploadedVideoIdRef.current || uploadedVideoId;

    if (!currentVideoId) {
      setUploadError("ID видео не найден. Пожалуйста, загрузите видео заново.");
      return;
    }

    console.log("[REPORT] Генерация отчета для video_id:", {
      fromRef: uploadedVideoIdRef.current,
      fromState: uploadedVideoId,
      currentVideoId,
    });

    setIsReportGenerating(true);
    setUploadError(null);

    try {
      const response = await analyzeEEG(currentVideoId);
      console.log("[REPORT] Ответ от сервера при анализе:", response);

      const analysisText = response?.data?.analysis;
      if (!analysisText) {
        throw new Error("Анализ не найден в ответе сервера");
      }

      setReportAnalysis(analysisText);
      setState("reportGenerated");

      // Сохраняем данные взгляда в localStorage для использования в отчете
      if (currentVideoId && gazeHistoryRef.current.length > 0) {
        try {
          // Сохраняем только валидные точки (relativeX и relativeY от 0 до 1)
          const validGazePoints = gazeHistoryRef.current.filter(
            (p) =>
              p.relativeX >= 0 &&
              p.relativeX <= 1 &&
              p.relativeY >= 0 &&
              p.relativeY <= 1
          );

          if (validGazePoints.length > 0) {
            localStorage.setItem(
              `gaze_data_${currentVideoId}`,
              JSON.stringify(validGazePoints)
            );
            console.log(
              `[GAZE] Сохранено ${validGazePoints.length} точек взгляда для video_id: ${currentVideoId}`
            );
          }
        } catch (err) {
          console.error("[GAZE] Ошибка при сохранении данных взгляда:", err);
        }
      }

      // Автоматически отправляем отчет в чат и спрашиваем что улучшить
      if (analysisText) {
        // Убираем markdown теги для текстового сообщения в чат
        const plainText = analysisText
          .replace(/#{1,6}\s+/g, "") // Убираем заголовки
          .replace(/\*\*(.*?)\*\*/g, "$1") // Убираем жирный текст
          .replace(/\n{3,}/g, "\n\n") // Убираем множественные переносы строк
          .trim();

        // Отправляем отчет в чат от пользователя
        addMessage({
          id: `report-${Date.now()}`,
          text: `Вот отчет по анализу видео:\n\n${plainText}`,
          sender: "user",
          timestamp: new Date().toISOString(),
        });

        // Отправляем вопрос от бота
        setTimeout(() => {
          addMessage({
            id: `bot-question-${Date.now()}`,
            text: "Что можно улучшить в этом отчете?",
            sender: "bot",
            timestamp: new Date().toISOString(),
          });
        }, 500);
      }
    } catch (error) {
      console.error("[REPORT] Ошибка при генерации отчета:", error);
      setUploadError(
        error instanceof Error
          ? `Ошибка генерации отчета: ${error.message}`
          : "Не удалось сгенерировать отчет. Попробуйте еще раз."
      );
    } finally {
      setIsReportGenerating(false);
    }
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

  const handleExportPDF = () => {
    if (!reportAnalysis) {
      setUploadError("Нет отчета для экспорта");
      return;
    }

    // Конвертируем markdown в HTML для PDF
    const convertMarkdownToHTML = (markdown: string): string => {
      const lines = markdown.split("\n");
      let html = "";
      let inList = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("# ")) {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += `<h1>${line.substring(2)}</h1>`;
        } else if (line.startsWith("## ")) {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += `<h2>${line.substring(3)}</h2>`;
        } else if (line.startsWith("### ")) {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += `<h3>${line.substring(4)}</h3>`;
        } else if (line.startsWith("- ") || line.startsWith("* ")) {
          if (!inList) {
            html += "<ul>";
            inList = true;
          }
          const listItem = line
            .substring(2)
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
          html += `<li>${listItem}</li>`;
        } else if (line === "") {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          html += "<br/>";
        } else {
          if (inList) {
            html += "</ul>";
            inList = false;
          }
          const processed = line
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(.*?)\*/g, "<em>$1</em>");
          html += `<p>${processed}</p>`;
        }
      }

      if (inList) {
        html += "</ul>";
      }

      return html;
    };

    const htmlContent = convertMarkdownToHTML(reportAnalysis);

    const printWindow = window.open("", "PRINT", "width=900,height=1200");
    if (!printWindow) {
      setUploadError(
        "Не удалось открыть окно для печати. Разрешите всплывающие окна."
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Отчет по анализу видео</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
              padding: 40px; 
              color: #111827; 
              line-height: 1.8;
              max-width: 800px;
              margin: 0 auto;
              background: white;
            }
            h1 { 
              font-size: 2rem; 
              font-weight: 600; 
              margin: 1.5rem 0 1rem 0;
              color: #1f2937;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 0.5rem;
            }
            h2 { 
              font-size: 1.5rem; 
              font-weight: 600; 
              margin: 1.5rem 0 0.75rem 0;
              color: #374151;
            }
            h3 { 
              font-size: 1.25rem; 
              font-weight: 600; 
              margin: 1.25rem 0 0.5rem 0;
              color: #4b5563;
            }
            p { 
              line-height: 1.8; 
              margin: 1rem 0; 
              color: #374151;
            }
            ul { 
              margin: 1rem 0 1rem 2rem; 
              line-height: 1.8;
            }
            li { 
              margin-bottom: 0.5rem; 
              color: #374151;
            }
            strong {
              font-weight: 600;
              color: #111827;
            }
            em {
              font-style: italic;
              color: #4b5563;
            }
            code {
              background: rgba(0,0,0,0.05);
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
            }
            @media print {
              body { padding: 20px; }
              @page { 
                margin: 1.5cm;
                size: A4;
              }
              h1 { page-break-after: avoid; }
              h2, h3 { page-break-after: avoid; }
            }
          </style>
        </head>
        <body>
          <h1>Отчет по анализу видео</h1>
          <p style="color: #6b7280; margin-bottom: 2rem; font-size: 0.9rem;">
            Дата создания: ${new Date().toLocaleString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <div style="margin-top: 2rem;">
            ${htmlContent}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    // Ждем загрузки и печатаем
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };
  const handleScreenshot = (screenshot: any) => {
    console.log("handleScreenshot вызван с:", {
      id: screenshot?.id,
      timestamp: screenshot?.timestamp,
      formattedTime: screenshot?.formattedTime,
      hasImage: !!screenshot?.image,
      imageLength: screenshot?.image?.length || 0,
    });

    const screenshotWithGaze = {
      ...screenshot,
      gaze: latestGazeRef.current,
    };

    setCapturedScreenshots((prev) => {
      const updated = [...prev, screenshotWithGaze];
      console.log(
        "Обновлен capturedScreenshots, новый размер:",
        updated.length
      );
      return updated;
    });
    console.log("Скриншот добавлен в состояние");
  };

  // Функция для рендеринга markdown в HTML
  const renderMarkdown = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let currentParagraph: string[] = [];
    let currentList: string[] = [];

    // Функция для обработки markdown в тексте
    const processMarkdown = (text: string): string => {
      let processed = text;
      // Жирный текст **text**
      processed = processed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Курсив *text* или _text_
      processed = processed.replace(/\*(.*?)\*/g, "<em>$1</em>");
      processed = processed.replace(/_(.*?)_/g, "<em>$1</em>");
      // Код `code`
      processed = processed.replace(
        /`(.*?)`/g,
        "<code style='background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px; font-family: monospace;'>$1</code>"
      );
      // Ссылки [text](url)
      processed = processed.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: var(--purple-500); text-decoration: underline;">$1</a>'
      );
      return processed;
    };

    const flushParagraph = () => {
      if (currentParagraph.length > 0) {
        const text = currentParagraph.join(" ");
        elements.push(
          <p
            key={`p-${elements.length}`}
            style={{
              marginBottom: "1rem",
              lineHeight: "1.8",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(text),
            }}
          />
        );
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul
            key={`ul-${elements.length}`}
            style={{
              marginLeft: "1.5rem",
              marginBottom: "1rem",
              lineHeight: "1.6",
            }}
          >
            {currentList.map((item, idx) => (
              <li
                key={idx}
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--profile-text)",
                }}
                dangerouslySetInnerHTML={{
                  __html: processMarkdown(item),
                }}
              />
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (trimmedLine.startsWith("# ")) {
        flushList();
        flushParagraph();
        const headingText = trimmedLine.substring(2);
        elements.push(
          <h1
            key={`h1-${index}`}
            style={{
              fontSize: "2rem",
              fontWeight: 600,
              marginTop: "1.5rem",
              marginBottom: "1rem",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(headingText),
            }}
          />
        );
      } else if (trimmedLine.startsWith("## ")) {
        flushList();
        flushParagraph();
        const headingText = trimmedLine.substring(3);
        elements.push(
          <h2
            key={`h2-${index}`}
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginTop: "1.25rem",
              marginBottom: "0.75rem",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(headingText),
            }}
          />
        );
      } else if (trimmedLine.startsWith("### ")) {
        flushList();
        flushParagraph();
        const headingText = trimmedLine.substring(4);
        elements.push(
          <h3
            key={`h3-${index}`}
            style={{
              fontSize: "1.25rem",
              fontWeight: 600,
              marginTop: "1rem",
              marginBottom: "0.5rem",
              color: "var(--profile-text)",
            }}
            dangerouslySetInnerHTML={{
              __html: processMarkdown(headingText),
            }}
          />
        );
      } else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
        flushParagraph();
        currentList.push(trimmedLine.substring(2));
      } else if (trimmedLine === "") {
        flushList();
        flushParagraph();
      } else {
        flushList();
        currentParagraph.push(trimmedLine);
      }
    });

    flushList();
    flushParagraph();

    return elements;
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
    setReportAnalysis(null);
    videoDurationRef.current = 0;
    setShowCalibration(false);
    setIsCalibrating(false);
    setCalibrationCompleted(false);
    setGazeIndicator(null);
    latestGazeRef.current = null;
    gazeHistoryRef.current = [];

    // Останавливаем отслеживание взгляда и камеру
    if (window.webgazer) {
      try {
        window.webgazer.end();
      } catch (error) {
        console.error("Ошибка при остановке WebGazer:", error);
      }
    }
    setEyeTrackingEnabled(false);
    setShowCameraPreview(false);
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

  const shouldShowGazeIndicator =
    state === "watching" &&
    eyeTrackingEnabled &&
    cameraPermission === "granted" &&
    calibrationCompleted &&
    !!gazeIndicator;

  const toggleEyeTracking = async () => {
    if (eyeTrackingEnabled) {
      // Выключаем отслеживание - используем ту же логику что и stopEyeTracking
      stopEyeTracking();
      return;
    }

    const permission =
      cameraPermission === "granted" ? "granted" : await requestCameraAccess();
    if (permission !== "granted") return;

    setEyeTrackingEnabled(true);
    setShowCameraPreview(true);
  };

  const stopEyeTracking = () => {
    // Останавливаем WebGazer
    if (window.webgazer) {
      try {
        window.webgazer.end();
      } catch (error) {
        console.error("Ошибка при остановке WebGazer:", error);
      }
    }

    // Закрываем доступ к камере
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          stream.getTracks().forEach((track) => {
            track.stop();
          });
        })
        .catch(() => {
          // Игнорируем ошибки при закрытии
        });
    }

    setEyeTrackingEnabled(false);
    setShowCameraPreview(false);
    setShowCalibration(false);
    setGazeIndicator(null);
    latestGazeRef.current = null;
    gazeHistoryRef.current = [];
    setCameraPermission("unknown");
  };

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
    <>
      {eyeTrackingEnabled && (showCalibration || state === "watching") && (
        <EyeTracking
          show={showCalibration}
          setShow={setShowCalibration}
          showCamera={showCameraPreview}
          showPoint={true}
          listener={handleGazeData}
        />
      )}
      {eyeTrackingEnabled && (
        <div className={styles.cameraToggleButton}>
          <div className={styles.cameraStatus}>
            <span className={styles.statusDot}></span>
            <span>Камера снимает</span>
          </div>
          <div className={styles.cameraActions}>
            <button
              className={styles.stopButton}
              onClick={stopEyeTracking}
              title="Прекратить отслеживание и закрыть доступ к камере"
            >
              Прекратить
            </button>
          </div>
        </div>
      )}
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
                    <span>
                      Запись не идет: нет данных от устройства BrainBit
                    </span>
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
            {state === "watching" && (
              <div
                className={
                  shouldShowGazeIndicator
                    ? styles.gazeStatusOk
                    : styles.gazeStatusWarn
                }
              >
                {shouldShowGazeIndicator
                  ? "Отслеживание взгляда активно"
                  : "Нет данных взгляда — проверьте камеру и калибровку"}
              </div>
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
              {uploadError && (
                <p className={styles.uploadError}>{uploadError}</p>
              )}
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

              <div className={styles.eyeTrackingSetup}>
                <div className={styles.eyeTrackingHeader}>
                  <h3>Отслеживание взгляда</h3>
                  <div className={styles.calibrationBadges}>
                    <span
                      className={
                        cameraPermission === "granted"
                          ? styles.badgeSuccess
                          : styles.badgeWarning
                      }
                    >
                      {cameraPermission === "granted"
                        ? "Камера: доступ разрешен"
                        : cameraPermission === "pending"
                        ? "Камера: запрос..."
                        : "Камера: доступ не разрешен"}
                    </span>
                    <span
                      className={
                        calibrationCompleted
                          ? styles.badgeSuccess
                          : styles.badgeWarning
                      }
                    >
                      {calibrationCompleted
                        ? "Калибровка завершена"
                        : isCalibrating
                        ? "Калибровка выполняется"
                        : "Нужно пройти калибровку"}
                    </span>
                  </div>
                </div>
                <p className={styles.eyeTrackingNote}>
                  Разрешите доступ к камере и нажмите «Начать калибровку». На
                  белом экране кликните по каждой точке 5 раз (как в примере
                  WebGazer), иначе тепловая карта и красный индикатор взгляда не
                  появятся.
                </p>
                <div className={styles.eyeTrackingActions}>
                  <button
                    className={styles.secondaryButton}
                    onClick={requestCameraAccess}
                    disabled={cameraPermission === "pending"}
                  >
                    Разрешить доступ к камере
                  </button>
                  <button
                    className={styles.startButton}
                    onClick={startCalibration}
                    disabled={
                      cameraPermission === "pending" ||
                      cameraPermission === "denied" ||
                      isCalibrating
                    }
                  >
                    {isCalibrating ? "Калибровка..." : "Начать калибровку"}
                  </button>
                  <button
                    className={
                      eyeTrackingEnabled
                        ? styles.dangerButton
                        : styles.startButton
                    }
                    onClick={toggleEyeTracking}
                  >
                    {eyeTrackingEnabled
                      ? "Выключить отслеживание"
                      : "Включить отслеживание"}
                  </button>
                </div>
                <p className={styles.calibrationHint}>
                  После окончания калибровки закройте окно «Close & load saved
                  model», затем нажмите «Начать просмотр».
                </p>
                {cameraPermission !== "granted" && (
                  <p className={styles.calibrationWarning}>
                    Без доступа к камере тепловая карта и отметки взгляда не
                    будут построены.
                  </p>
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
                    <div className={styles.videoWrapper} ref={videoOverlayRef}>
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
                      {shouldShowGazeIndicator && gazeIndicator && (
                        <div
                          className={styles.gazeDot}
                          style={{
                            left: `${gazeIndicator.relativeX * 100}%`,
                            top: `${gazeIndicator.relativeY * 100}%`,
                          }}
                        />
                      )}
                    </div>
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
                      Скриншоты появятся здесь при обнаружении изменений
                      состояния
                    </div>
                  )}

                  {/* Уменьшенный график концентрации под скриншотами */}
                  <div className={styles.chartContainerSmall}>
                    <KeyIndicators />
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

              {uploadError && (
                <div
                  className={styles.uploadError}
                  style={{ marginBottom: "1rem" }}
                >
                  {uploadError}
                </div>
              )}

              {reportAnalysis && (
                <div
                  className={styles.reportContent}
                  style={{
                    backgroundColor: "var(--profile-bg-secondary)",
                    padding: "2rem",
                    borderRadius: "0.75rem",
                    marginBottom: "2rem",
                    color: "var(--profile-text)",
                    lineHeight: "1.6",
                  }}
                >
                  <div>{renderMarkdown(reportAnalysis)}</div>
                </div>
              )}

              <div className={styles.chartContainer}>
                <KeyIndicators />
              </div>

              {/* Скриншоты с максимальными активностями */}
              {capturedScreenshots.length > 0 && (
                <div className={styles.screenshotsSection}>
                  <h3>
                    Скриншоты с активностями ({capturedScreenshots.length})
                  </h3>
                  <div className={styles.screenshotsGrid}>
                    {capturedScreenshots.map((screenshot) => (
                      <div
                        key={screenshot.id}
                        className={styles.screenshotCard}
                      >
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
                            {screenshot.trigger.type ===
                              "engagement_increase" && "❤️"}
                            {screenshot.trigger.type === "stress_peak" && "⚠️"}
                            {screenshot.trigger.type === "attention_peak" &&
                              "📈"}
                            <span>
                              {screenshot.trigger.message || "Событие"}
                            </span>
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
                <button
                  className={styles.saveButton}
                  onClick={handleSaveReport}
                >
                  Скачать PDF
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
    </>
  );
}

export default Analysis;
