import json
import asyncio
import websockets
from PyQt6.QtCore import QObject, pyqtSignal, QThread, QTimer
from typing import Optional, Dict, Any
import threading
import sys
import os

# Добавляем путь к корневой директории для импорта config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


class WebSocketClient(QObject):
    """WebSocket клиент для подключения к серверу"""
    connected = pyqtSignal()
    disconnected = pyqtSignal()
    error = pyqtSignal(str)
    message_received = pyqtSignal(dict)
    
    def __init__(self, url: str = None):
        super().__init__()
        self.url = url if url is not None else config.WEBSOCKET_SERVER_URL
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.connected_status = False
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.thread: Optional[threading.Thread] = None
        self.worker: Optional['WebSocketWorker'] = None
        self.running = False
        
    def start(self):
        """Запуск WebSocket клиента в отдельном потоке"""
        if self.running:
            return
            
        self.running = True
        self.worker = WebSocketWorker(self.url)
        self.worker.connected_callback = self._on_connected
        self.worker.disconnected_callback = self._on_disconnected
        self.worker.error_callback = self._on_error
        self.worker.message_callback = self._on_message
        
        self.thread = threading.Thread(target=self.worker.run, daemon=True)
        self.thread.start()
        
    def stop(self):
        """Остановка WebSocket клиента"""
        self.running = False
        if self.worker:
            self.worker.stop()
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=2)
            
    def _on_connected(self):
        self.connected_status = True
        self.connected.emit()
        
    def _on_disconnected(self):
        self.connected_status = False
        self.disconnected.emit()
        
    def _on_error(self, error_msg: str):
        self.error.emit(error_msg)
        
    def _on_message(self, message: dict):
        self.message_received.emit(message)
        
    def send_pair_token(self, token: str):
        """Отправка токена для подключения"""
        if self.worker:
            self.worker.send_message({
                "type": "pair",
                "pair_token": token
            })
            
    def send_eeg_sample(self, data: Dict[str, Any]):
        """Отправка EEG данных"""
        if self.worker:
            self.worker.send_message({
                "type": "eeg_sample",
                "data": data
            })
            
    def is_connected(self) -> bool:
        """Проверка статуса подключения"""
        return self.connected_status


class WebSocketWorker:
    """Рабочий класс для WebSocket в отдельном потоке"""
    
    def __init__(self, url: str):
        self.url = url
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.running = False
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.pending_messages = []
        self.connected_callback = None
        self.disconnected_callback = None
        self.error_callback = None
        self.message_callback = None
        
    def run(self):
        """Запуск WebSocket соединения"""
        self.running = True
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        try:
            self.loop.run_until_complete(self._connect())
        except Exception as e:
            if self.error_callback:
                self.error_callback(str(e))
        
    async def _connect(self):
        """Подключение к WebSocket серверу"""
        try:
            async with websockets.connect(self.url) as websocket:
                self.websocket = websocket
                if self.connected_callback:
                    self.connected_callback()
                
                # Отправляем накопленные сообщения
                for message in self.pending_messages:
                    await websocket.send(json.dumps(message, ensure_ascii=False))
                self.pending_messages.clear()
                
                # Слушаем сообщения
                async for message in websocket:
                    if not self.running:
                        break
                    try:
                        data = json.loads(message)
                        if self.message_callback:
                            self.message_callback(data)
                    except json.JSONDecodeError:
                        pass
                        
        except websockets.exceptions.ConnectionClosed:
            if self.disconnected_callback:
                self.disconnected_callback()
        except Exception as e:
            if self.error_callback:
                self.error_callback(str(e))
        finally:
            self.websocket = None
            if self.disconnected_callback and self.running:
                self.disconnected_callback()
            
    def send_message(self, message: dict):
        """Отправка сообщения"""
        if self.websocket and self.loop and self.loop.is_running():
            asyncio.run_coroutine_threadsafe(
                self._send_message_async(message),
                self.loop
            )
        else:
            # Сохраняем сообщение для отправки после подключения
            self.pending_messages.append(message)
            
    async def _send_message_async(self, message: dict):
        """Асинхронная отправка сообщения"""
        if self.websocket:
            try:
                await self.websocket.send(json.dumps(message, ensure_ascii=False))
            except Exception as e:
                if self.error_callback:
                    self.error_callback(f"Ошибка отправки: {str(e)}")
                
    def stop(self):
        """Остановка WebSocket соединения"""
        self.running = False
        if self.loop and self.loop.is_running():
            self.loop.call_soon_threadsafe(self.loop.stop)

