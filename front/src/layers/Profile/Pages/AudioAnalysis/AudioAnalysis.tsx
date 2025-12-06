import { useState, useEffect, useRef } from "react";
import KeyIndicators from "../../modules/graphics/KeyIndicators/KeyIndicators";
import ConcentrationEngagementChart from "../../modules/graphics/KeyIndicators/components/ConcentrationEngagementChart/ConcentrationEngagementChart";
import UploadFile from "../../../../core/components/UploadFile/UploadFile";
import { uploadAudio } from "../../../../api/files";
import { useUserStore } from "../../../../store/userStore";
import { useWebSocketStore } from "../../../../store/websocketStore";
import { Music, Play, Pause, Volume2 } from "lucide-react";
import styles from "./AudioAnalysis.module.scss";

type AudioAnalysisState =
  | "upload"
  | "ready"
  | "playing"
  | "finished";

interface ConcentrationEvent {
  timecode: number;
  concentration: number;
  relaxation: number;
  type: "increase" | "decrease";
  change: number;
}

function AudioAnalysis() {
  const { token } = useUserStore();
  const { lastMessage } = useWebSocketStore();
  const [state, setState] = useState<AudioAnalysisState>("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [concentrationEvents, setConcentrationEvents] = useState<ConcentrationEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioDurationRef = useRef<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const uploadedAudioIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timecodeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = async (file: File | null) => {
    if (file && file.type.startsWith("audio/")) {
      setUploadError(null);
      setIsUploading(true);
      setAudioFile(file);

      // Локальный URL для предпросмотра
      const localUrl = URL.createObjectURL(file);
      setAudioURL(localUrl);

      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = localUrl;
      audio.onloadedmetadata = () => {
        audioDurationRef.current = audio.duration;
        audio.remove();
      };

      try {
        const response = await uploadAudio(file);
        console.log("Ответ от сервера при загрузке аудио:", response);
        const data = response?.data;

        if (data?.id) {
          setUploadedAudioId(data.id);
          uploadedAudioIdRef.current = data.id;
        } else {
          console.error("ID аудио не найден в ответе сервера:", data);
        }

        setState("ready");
        connectToSocket();
      } catch (error) {
        console.error("Ошибка загрузки аудио", error);
        setUploadError("Не удалось загрузить аудио. Попробуйте еще раз.");
        setState("upload");
        setAudioFile(null);
        setAudioURL(null);
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
      const wsUrl = `ws://${host}:${port}/ws/client?token=${encodeURIComponent(token)}`;

      const ws = new WebSocket(wsUrl);
      let connectionTimeout: NodeJS.Timeout | null = null;

      connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          console.error("Таймаут подключения к WebSocket");
          ws.close();
          setIsSocketConnected(false);
          setUploadError("Таймаут подключения к серверу. Проверьте интернет-соединение.");
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

          if (data.type === "audio_tracking_started") {
            setIsTracking(true);
            console.log("Отслеживание аудио начато");
          } else if (data.type === "audio_tracking_ended") {
            setIsTracking(false);
            console.log("Отслеживание аудио завершено");
            if (data.events) {
              setConcentrationEvents(data.events);
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
        setUploadError("Ошибка подключения к серверу. Проверьте интернет-соединение.");
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

          if (state === "playing" && event.code === 1011) {
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            reconnectTimeoutRef.current = setTimeout(() => {
              if (state === "playing" && !isSocketConnected && token) {
                console.log("Переподключаемся к WebSocket...");
                connectToSocket();
              }
              reconnectTimeoutRef.current = null;
            }, 2000);
          }

          if (state === "ready" || state === "playing") {
            setUploadError(errorMessage);
          }
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Ошибка создания WebSocket:", error);
      setIsSocketConnected(false);
      setUploadError("Не удалось создать WebSocket соединение. Проверьте настройки браузера.");
    }
  };

  const handleStartPlaying = () => {
    if (!audioURL) {
      setUploadError("Аудио не загружено. Пожалуйста, загрузите аудио сначала.");
      return;
    }

    if (!isSocketConnected) {
      setUploadError("Соединение с сервером не установлено. Пожалуйста, подождите.");
      return;
    }

    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      setUploadError("Соединение с сервером не готово. Пожалуйста, подождите.");
      return;
    }

    setState("playing");

    // Отправляем audio_start
    const audioStartMessage = { type: "audio_start" };
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(audioStartMessage));
        console.log("Отправлен audio_start:", audioStartMessage);
      }
    } catch (error) {
      console.error("Ошибка при отправке audio_start:", error);
      setUploadError("Не удалось отправить команду начала воспроизведения.");
    }

    // Запускаем отправку таймкодов
    if (audioRef.current) {
      audioRef.current.play();
      startTimecodeUpdates();
    }
  };

  const startTimecodeUpdates = () => {
    if (timecodeUpdateIntervalRef.current) {
      clearInterval(timecodeUpdateIntervalRef.current);
    }

    // Отправляем таймкод каждую секунду, когда аудио играет
    timecodeUpdateIntervalRef.current = setInterval(() => {
      if (
        audioRef.current &&
        !audioRef.current.paused &&
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        const currentTime = audioRef.current.currentTime;
        const currentAudioId = uploadedAudioIdRef.current || uploadedAudioId;

        if (currentAudioId) {
          const timecodeMessage = {
            type: "audio_timecode",
            timecode: currentTime,
            audio_id: currentAudioId,
          };
          wsRef.current.send(JSON.stringify(timecodeMessage));
        }
      }
    }, 1000); // Отправляем таймкод каждую секунду
  };

  const handleAudioEnd = () => {
    // Останавливаем отправку таймкодов
    if (timecodeUpdateIntervalRef.current) {
      clearInterval(timecodeUpdateIntervalRef.current);
      timecodeUpdateIntervalRef.current = null;
    }

    // Отправляем audio_end
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const audioEndMessage = { type: "audio_end" };
      wsRef.current.send(JSON.stringify(audioEndMessage));
      console.log("Отправлен audio_end");
    }

    setState("finished");
  };

  const handleReset = () => {
    // Останавливаем таймкоды
    if (timecodeUpdateIntervalRef.current) {
      clearInterval(timecodeUpdateIntervalRef.current);
      timecodeUpdateIntervalRef.current = null;
    }

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
    setUploadedAudioId(null);
    uploadedAudioIdRef.current = null;
    setUploadError(null);
    setIsSocketConnected(false);
    setIsTracking(false);
    setState("upload");
    setConcentrationEvents([]);
    audioDurationRef.current = 0;
  };

  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (timecodeUpdateIntervalRef.current) {
        clearInterval(timecodeUpdateIntervalRef.current);
        timecodeUpdateIntervalRef.current = null;
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
    state === "playing" && isSocketConnected && hasChartData;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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
          {state === "playing" && !shouldShowTrackingIndicator && (
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
          {state === "playing" && (
            <button
              className={styles.stopButton}
              onClick={handleReset}
              title="Остановить воспроизведение"
            >
              Остановить
            </button>
          )}
        </div>

        {state === "upload" && (
          <div className={styles.uploadSection}>
            <p className={styles.uploadPrompt}>Загрузите аудио файл</p>
            <div className={styles.uploadWrapper}>
              <UploadFile onFileSelect={handleFileSelect} fileType="audio" />
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
                <div className={styles.audioInfoItem}>
                  <Music size={20} />
                  <div>
                    <p className={styles.audioFileName}>{audioFile.name}</p>
                    <p className={styles.audioFileSize}>
                      Размер: {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}

            {uploadedAudioId && (
              <div className={styles.audioInfo}>
                <p>ID аудио: {uploadedAudioId}</p>
              </div>
            )}

            <div className={styles.actionButtons}>
              <button
                className={styles.startButton}
                onClick={handleStartPlaying}
                disabled={!isSocketConnected || isUploading}
              >
                Начать воспроизведение
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

        {state === "playing" && (
          <div className={styles.playingSection}>
            {!audioURL ? (
              <div className={styles.uploadError}>
                Ошибка: Аудио не загружено. Пожалуйста, вернитесь и загрузите аудио.
              </div>
            ) : (
              <>
                <div className={styles.audioPlayerContainer}>
                  <div className={styles.audioPlayer}>
                    <div className={styles.audioPlayerHeader}>
                      <Music size={24} />
                      <span>{audioFile?.name || "Аудио файл"}</span>
                    </div>
                    <audio
                      ref={audioRef}
                      src={audioURL}
                      onEnded={handleAudioEnd}
                      onLoadedMetadata={() => {
                        if (audioRef.current) {
                          audioDurationRef.current = audioRef.current.duration;
                        }
                      }}
                      onTimeUpdate={() => {
                        // Обновляем состояние текущего времени для прогресс-бара
                        if (audioRef.current) {
                          setCurrentTime(audioRef.current.currentTime);
                        }
                      }}
                    />
                    <div className={styles.audioControls}>
                      <button
                        className={styles.playPauseButton}
                        onClick={() => {
                          if (audioRef.current) {
                            if (audioRef.current.paused) {
                              audioRef.current.play();
                            } else {
                              audioRef.current.pause();
                            }
                          }
                        }}
                      >
                        {audioRef.current?.paused ? (
                          <Play size={24} fill="currentColor" />
                        ) : (
                          <Pause size={24} fill="currentColor" />
                        )}
                      </button>
                      <div className={styles.audioProgress}>
                        <div className={styles.audioTime}>
                          {formatTime(currentTime)} / {formatTime(audioDurationRef.current)}
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{
                              width:
                                audioDurationRef.current > 0
                                  ? `${(currentTime / audioDurationRef.current) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      </div>
                      <Volume2 size={20} />
                    </div>
                  </div>
                </div>

                {/* График концентрации */}
                <div className={styles.chartContainerSmall}>
                  <ConcentrationEngagementChart />
                </div>

                {/* События концентрации */}
                {concentrationEvents.length > 0 && (
                  <div className={styles.eventsSection}>
                    <h3 className={styles.eventsTitle}>
                      События концентрации ({concentrationEvents.length})
                    </h3>
                    <div className={styles.eventsList}>
                      {concentrationEvents.map((event, index) => (
                        <div key={index} className={styles.eventItem}>
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
                                ? "Подъем"
                                : "Спад"}
                            </span>
                          </div>
                          <div className={styles.eventTimecode}>
                            {formatTime(event.timecode)}
                          </div>
                          <div className={styles.eventValues}>
                            <div className={styles.eventValue}>
                              <span>Концентрация:</span>
                              <span>{event.concentration.toFixed(1)}%</span>
                            </div>
                            <div className={styles.eventValue}>
                              <span>Изменение:</span>
                              <span
                                className={
                                  event.change > 0
                                    ? styles.positiveChange
                                    : styles.negativeChange
                                }
                              >
                                {event.change > 0 ? "+" : ""}
                                {event.change.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                <div className={styles.audioPlayer}>
                  <div className={styles.audioPlayerHeader}>
                    <Music size={24} />
                    <span>{audioFile?.name || "Аудио файл"}</span>
                  </div>
                  <audio ref={audioRef} src={audioURL} controls />
                </div>
              )}
            </div>

            <div className={styles.chartContainer}>
              <KeyIndicators />
            </div>

            {/* События концентрации */}
            {concentrationEvents.length > 0 && (
              <div className={styles.eventsSection}>
                <h3 className={styles.eventsTitle}>
                  События концентрации ({concentrationEvents.length})
                </h3>
                <div className={styles.eventsList}>
                  {concentrationEvents.map((event, index) => (
                    <div key={index} className={styles.eventItem}>
                      <div
                        className={`${styles.eventType} ${
                          event.type === "increase"
                            ? styles.eventIncrease
                            : styles.eventDecrease
                        }`}
                      >
                        {event.type === "increase" ? "📈" : "📉"}
                        <span>
                          {event.type === "increase" ? "Подъем" : "Спад"}
                        </span>
                      </div>
                      <div className={styles.eventTimecode}>
                        {formatTime(event.timecode)}
                      </div>
                      <div className={styles.eventValues}>
                        <div className={styles.eventValue}>
                          <span>Концентрация:</span>
                          <span>{event.concentration.toFixed(1)}%</span>
                        </div>
                        <div className={styles.eventValue}>
                          <span>Изменение:</span>
                          <span
                            className={
                              event.change > 0
                                ? styles.positiveChange
                                : styles.negativeChange
                            }
                          >
                            {event.change > 0 ? "+" : ""}
                            {event.change.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.stats}>
              <div className={styles.statItem}>
                <h3>Общее время</h3>
                <p>{formatTime(audioDurationRef.current)}</p>
              </div>
              <div className={styles.statItem}>
                <h3>Событий концентрации</h3>
                <p>{concentrationEvents.length}</p>
              </div>
              <div className={styles.statItem}>
                <h3>Подъемов</h3>
                <p>
                  {
                    concentrationEvents.filter((e) => e.type === "increase")
                      .length
                  }
                </p>
              </div>
              <div className={styles.statItem}>
                <h3>Спадов</h3>
                <p>
                  {
                    concentrationEvents.filter((e) => e.type === "decrease")
                      .length
                  }
                </p>
              </div>
            </div>

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

