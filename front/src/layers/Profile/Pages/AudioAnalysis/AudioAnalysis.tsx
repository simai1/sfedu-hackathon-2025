import { useState, useEffect, useRef } from "react";
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators";
import ConcentrationEngagementChart from "../../modules/graphics/KeyIndicators/components/ConcentrationEngagementChart/ConcentrationEngagementChart";
import UploadAudioFile from "../../../../core/components/UploadAudioFile/UploadAudioFile";
import { useUserStore } from "../../../../store/userStore";
import { useWebSocketStore } from "../../../../store/websocketStore";
import styles from "./AudioAnalysis.module.scss";

type AudioAnalysisState =
  | "upload"
  | "ready"
  | "listening"
  | "finished";

interface ConcentrationEvent {
  id: string;
  timestamp: number; // Время в секундах от начала прослушивания
  type: "increase" | "decrease";
  concentration: number;
  formattedTime: string;
}

interface AudioAnalysisData {
  events: ConcentrationEvent[];
  concentrationHistory: Array<{
    timestamp: number;
    concentration: number;
  }>;
  maxConcentration: number;
  minConcentration: number;
  averageConcentration: number;
}

function AudioAnalysis() {
  const { token } = useUserStore();
  const { lastMessage } = useWebSocketStore();
  const [state, setState] = useState<AudioAnalysisState>("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [analysisData, setAnalysisData] = useState<AudioAnalysisData>({
    events: [],
    concentrationHistory: [],
    maxConcentration: 0,
    minConcentration: 100,
    averageConcentration: 0,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousConcentrationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const concentrationThreshold = 10; // Порог изменения концентрации в процентах

  const extractConcentrationFromMessage = (message: any): number | null => {
    const channels = message?.data?.channels || message?.channels;

    if (!channels) {
      return null;
    }

    const channelKeys = Object.keys(channels);
    if (channelKeys.length === 0) {
      return null;
    }

    let totalAttention = 0;
    let validChannels = 0;

    channelKeys.forEach((key) => {
      const channel = channels[key];
      if (channel?.mind?.relative_attention !== undefined) {
        totalAttention += channel.mind.relative_attention;
        validChannels++;
      }
    });

    if (validChannels === 0) {
      return null;
    }

    return Math.max(0, Math.min(100, totalAttention / validChannels));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleFileSelect = async (file: File | null) => {
    if (file && file.type.startsWith("audio/")) {
      setUploadError(null);
      setIsUploading(true);
      setAudioFile(file);

      // Локальный URL для предпросмотра
      const localUrl = URL.createObjectURL(file);
      setAudioURL(localUrl);

      // Получаем длительность аудио
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = localUrl;
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
        audio.remove();
      };

      // В реальном приложении здесь была бы загрузка на сервер
      // Для фронтенда просто устанавливаем состояние ready
      setState("ready");
      connectToSocket();
      setIsUploading(false);
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
      const host = import.meta.env.VITE_WS_HOST || "5.129.252.186";
      const port = import.meta.env.VITE_WS_PORT || "3000";
      const wsUrl = `ws://${host}:${port}/ws/client?token=${encodeURIComponent(
        token
      )}`;

      console.log("Подключение к WebSocket для анализа аудио");

      const ws = new WebSocket(wsUrl);
      let connectionTimeout: NodeJS.Timeout | null = null;

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
        console.log("WebSocket подключен успешно для анализа аудио");
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        setIsSocketConnected(true);
        setUploadError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Получено сообщение от WebSocket:", data);

          if (data.type === "audio_tracking_started") {
            setIsTracking(true);
            console.log("Отслеживание аудио начато");
          } else if (data.type === "audio_tracking_ended") {
            setIsTracking(false);
            console.log("Отслеживание аудио завершено");
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

          if (state === "listening" && event.code === 1011) {
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              if (state === "listening" && !isSocketConnected && token) {
                console.log("Переподключаемся к WebSocket...");
                connectToSocket();
              }
              reconnectTimeoutRef.current = null;
            }, 2000);
          }

          if (state === "ready" || state === "listening") {
            setUploadError(errorMessage);
          }
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

  const handleStartListening = () => {
    if (!audioURL) {
      setUploadError("Аудио не загружено. Пожалуйста, загрузите аудио сначала.");
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

    setState("listening");
    startTimeRef.current = Date.now();
    previousConcentrationRef.current = null;

    // Отправляем audio_start
    const audioStartMessage = { type: "audio_start" };
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(audioStartMessage));
        console.log("Отправлен audio_start:", audioStartMessage);
      }
    } catch (error) {
      console.error("Ошибка при отправке audio_start:", error);
      setUploadError("Не удалось отправить команду начала прослушивания.");
    }

    // Запускаем аудио
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleAudioEnd = () => {
    // Отправляем audio_end
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const audioEndMessage = { type: "audio_end" };
      wsRef.current.send(JSON.stringify(audioEndMessage));
      console.log("Отправлен audio_end");
    }

    setState("finished");
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Отслеживание изменений концентрации
  useEffect(() => {
    if (state !== "listening" || !lastMessage) {
      return;
    }

    const concentration = extractConcentrationFromMessage(lastMessage);
    if (concentration === null) {
      return;
    }

    const currentTimestamp = currentTime;
    const previousConcentration = previousConcentrationRef.current;

    // Добавляем в историю
    setAnalysisData((prev) => ({
      ...prev,
      concentrationHistory: [
        ...prev.concentrationHistory,
        { timestamp: currentTimestamp, concentration },
      ],
      maxConcentration: Math.max(prev.maxConcentration, concentration),
      minConcentration: Math.min(prev.minConcentration, concentration),
    }));

    // Проверяем изменения концентрации
    if (previousConcentration !== null) {
      const diff = concentration - previousConcentration;

      if (Math.abs(diff) >= concentrationThreshold) {
        const eventType = diff > 0 ? "increase" : "decrease";
        const newEvent: ConcentrationEvent = {
          id: `event-${Date.now()}-${Math.random()}`,
          timestamp: currentTimestamp,
          type: eventType,
          concentration,
          formattedTime: formatTime(currentTimestamp),
        };

        setAnalysisData((prev) => ({
          ...prev,
          events: [...prev.events, newEvent],
        }));

        console.log("Событие концентрации:", {
          type: eventType,
          timestamp: currentTimestamp,
          concentration,
          previousConcentration,
          diff,
        });
      }
    }

    previousConcentrationRef.current = concentration;
  }, [lastMessage, state, currentTime]);

  // Вычисляем среднюю концентрацию
  useEffect(() => {
    if (analysisData.concentrationHistory.length > 0) {
      const sum = analysisData.concentrationHistory.reduce(
        (acc, item) => acc + item.concentration,
        0
      );
      const average = sum / analysisData.concentrationHistory.length;
      setAnalysisData((prev) => ({
        ...prev,
        averageConcentration: average,
      }));
    }
  }, [analysisData.concentrationHistory.length]);

  const handleReset = () => {
    // Закрываем WebSocket соединение
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setAudioFile(null);
    setAudioURL(null);
    setUploadError(null);
    setIsSocketConnected(false);
    setIsTracking(false);
    setState("upload");
    setCurrentTime(0);
    setAudioDuration(0);
    setAnalysisData({
      events: [],
      concentrationHistory: [],
      maxConcentration: 0,
      minConcentration: 100,
      averageConcentration: 0,
    });
    previousConcentrationRef.current = null;
    startTimeRef.current = 0;
  };

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

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

    const hasValidData = channelKeys.some((key) => {
      const channel = channels[key];
      return (
        channel?.mind?.relative_attention !== undefined ||
        channel?.mind?.relative_relaxation !== undefined
      );
    });

    return hasValidData;
  })();

  const shouldShowTrackingIndicator =
    state === "listening" && isSocketConnected && hasChartData;

  return (
    <div className={styles.audioAnalysisContainer}>
      <div className={styles.audioAnalysis}>
        <div className={styles.headerWithIndicator}>
          <h1>Анализ аудио</h1>
          {shouldShowTrackingIndicator && (
            <div className={styles.trackingIndicator}>
              <span className={styles.trackingDot}></span>
              <span>Идет запись состояния</span>
            </div>
          )}
          {state === "listening" && !shouldShowTrackingIndicator && (
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
          {state === "listening" && (
            <button
              className={styles.stopButton}
              onClick={handleReset}
              title="Остановить прослушивание"
            >
              Остановить
            </button>
          )}
        </div>

        {state === "upload" && (
          <div className={styles.uploadSection}>
            <p className={styles.uploadPrompt}>Загрузите аудио файл</p>
            <div className={styles.uploadWrapper}>
              <UploadAudioFile onFileSelect={handleFileSelect} />
            </div>
            {isUploading && (
              <p className={styles.uploadStatus}>
                Загружаем аудио на сервер...
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

            {audioFile && (
              <div className={styles.audioInfo}>
                <p>Файл: {audioFile.name}</p>
                <p>Размер: {(audioFile.size / 1024 / 1024).toFixed(2)} MB</p>
                {audioDuration > 0 && (
                  <p>Длительность: {formatTime(audioDuration)}</p>
                )}
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                className={styles.startButton}
                onClick={handleStartListening}
                disabled={!isSocketConnected || isUploading}
              >
                Начать прослушивание
              </button>
              <button className={styles.resetButton} onClick={handleReset}>
                Загрузить другое аудио
              </button>
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>
          </div>
        )}

        {state === "listening" && (
          <div className={styles.listeningSection}>
            {!audioURL ? (
              <div className={styles.uploadError}>
                Ошибка: Аудио не загружено. Пожалуйста, вернитесь и загрузите
                аудио.
              </div>
            ) : (
              <>
                <div className={styles.audioPlayerContainer}>
                  <audio
                    ref={audioRef}
                    src={audioURL}
                    controls
                    className={styles.audioPlayer}
                    onEnded={handleAudioEnd}
                    onTimeUpdate={handleAudioTimeUpdate}
                  />
                  <div className={styles.audioProgress}>
                    <span>Текущее время: {formatTime(currentTime)}</span>
                    {audioDuration > 0 && (
                      <span>Длительность: {formatTime(audioDuration)}</span>
                    )}
                  </div>
                </div>

                {/* События концентрации */}
                {analysisData.events.length > 0 ? (
                  <div className={styles.eventsContainer}>
                    <h3 className={styles.eventsTitle}>
                      События концентрации ({analysisData.events.length})
                    </h3>
                    <div className={styles.eventsScroll}>
                      {analysisData.events.map((event) => (
                        <div key={event.id} className={styles.eventItem}>
                          <div
                            className={`${styles.eventType} ${
                              event.type === "increase"
                                ? styles.eventIncrease
                                : styles.eventDecrease
                            }`}
                          >
                            {event.type === "increase" ? "📈" : "📉"}
                            <span>
                              {event.type === "increase"
                                ? "Повышение"
                                : "Понижение"}
                            </span>
                          </div>
                          <div className={styles.eventTime}>
                            {event.formattedTime}
                          </div>
                          <div className={styles.eventConcentration}>
                            Концентрация: {event.concentration.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className={styles.eventsEmpty}>
                    События изменения концентрации появятся здесь
                  </div>
                )}

                {/* График концентрации */}
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
            <div className={styles.audioPlayerContainer}>
              {audioURL && (
                <audio
                  ref={audioRef}
                  src={audioURL}
                  controls
                  className={styles.audioPlayer}
                />
              )}
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            {/* Статистика */}
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <h3>Максимальная концентрация</h3>
                <p>{analysisData.maxConcentration.toFixed(1)}%</p>
              </div>
              <div className={styles.statItem}>
                <h3>Минимальная концентрация</h3>
                <p>{analysisData.minConcentration.toFixed(1)}%</p>
              </div>
              <div className={styles.statItem}>
                <h3>Средняя концентрация</h3>
                <p>{analysisData.averageConcentration.toFixed(1)}%</p>
              </div>
              <div className={styles.statItem}>
                <h3>Событий зафиксировано</h3>
                <p>{analysisData.events.length}</p>
              </div>
            </div>

            {/* События концентрации */}
            {analysisData.events.length > 0 && (
              <div className={styles.eventsSection}>
                <h3>События изменения концентрации</h3>
                <div className={styles.eventsGrid}>
                  {analysisData.events.map((event) => (
                    <div key={event.id} className={styles.eventCard}>
                      <div className={styles.eventCardHeader}>
                        <div
                          className={`${styles.eventType} ${
                            event.type === "increase"
                              ? styles.eventIncrease
                              : styles.eventDecrease
                          }`}
                        >
                          {event.type === "increase" ? "📈" : "📉"}
                          <span>
                            {event.type === "increase"
                              ? "Повышение"
                              : "Понижение"}
                          </span>
                        </div>
                        <div className={styles.eventTime}>{event.formattedTime}</div>
                      </div>
                      <div className={styles.eventConcentration}>
                        Концентрация: {event.concentration.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button className={styles.resetButton} onClick={handleReset}>
                Загрузить новое аудио
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AudioAnalysis;
