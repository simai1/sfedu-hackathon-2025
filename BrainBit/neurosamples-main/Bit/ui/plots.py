from PyQt6 import QtCore, QtWidgets
from PyQt6.QtWidgets import QWidget
from PyQt6.QtCore import QTimer
from pyqtgraph import PlotWidget


class SignalPlot(QWidget):
    window = 5
    sampling_rate = 250

    def __init__(self):
        super().__init__()
        self.yAx = [i for i in range(self.sampling_rate * self.window)]
        self.xAx = [0 for _ in range(self.sampling_rate * self.window)]
        layout = QtWidgets.QVBoxLayout()
        self.graphWidget = PlotWidget()
        self.graphWidget.plotItem.setMouseEnabled(y=False)
        self.graphWidget.plotItem.setMouseEnabled(x=False)
        self.graphWidget.setXRange(0, self.sampling_rate * self.window)
        self.graphWidget.setYRange(-1, 1)
        layout.addWidget(self.graphWidget)
        self.setLayout(layout)
        self.line = self.graphWidget.plot(self.yAx, self.xAx)
        self.timer = QTimer()
        self.timer.setInterval(60)
        self.timer.timeout.connect(self.__draw_signal)
        # Убеждаемся, что таймер остановлен при инициализации
        self.timer.stop()
        
        # Добавляем флаг для отслеживания активности графика
        self.__is_active = False

    def start_draw(self):
        self.__is_active = True
        self.timer.start()

    def stop_draw(self):
        self.timer.stop()
        self.__is_active = False
        # Принудительно обновляем виджет для корректного завершения отрисовки
        if hasattr(self, 'graphWidget'):
            self.graphWidget.repaint()
    
    def cleanup(self):
        """Метод для безопасной очистки ресурсов графика"""
        self.stop_draw()
        # Отключаем все сигналы
        if hasattr(self, 'timer'):
            try:
                self.timer.timeout.disconnect()
            except (TypeError, RuntimeError):
                # Сигнал уже отключен или таймер удален
                pass
        # Очищаем данные графика
        if hasattr(self, 'line'):
            try:
                self.line.clear()
            except RuntimeError:
                # График уже удален
                pass
        # Очищаем виджет графика
        if hasattr(self, 'graphWidget'):
            try:
                self.graphWidget.clear()
            except RuntimeError:
                # Виджет уже удален
                pass

    def update_data(self, signal):
        if not self.__is_active:
            return
        for sample in signal:
            self.yAx.pop(0)
            self.yAx.append(self.yAx[-1] + 1)
            self.xAx.pop(0)
            self.xAx.append(sample)

    def __draw_signal(self):
        if not self.__is_active:
            return
        try:
            self.graphWidget.setXRange(self.yAx[0], self.yAx[-1])
            self.line.setData(self.yAx, self.xAx)
            # Принудительно перерисовываем график
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise



class SpectrumPlot(QWidget):
    sampling_rate = 250

    def __init__(self):
        super().__init__()
        self.yAx = [i for i in range(self.sampling_rate)]
        self.xAx = [0 for _ in range(self.sampling_rate)]
        layout = QtWidgets.QVBoxLayout()
        self.graphWidget = PlotWidget()
        self.graphWidget.plotItem.setMouseEnabled(y=False)
        self.graphWidget.plotItem.setMouseEnabled(x=False)
        self.graphWidget.setXRange(0, self.sampling_rate)
        self.graphWidget.setYRange(0, 1)
        layout.addWidget(self.graphWidget)
        self.setLayout(layout)
        self.line = self.graphWidget.plot(self.yAx, self.xAx)
        self.timer = QTimer()
        self.timer.setInterval(60)
        self.timer.timeout.connect(self.__draw_plot)
        # Убеждаемся, что таймер остановлен при инициализации
        self.timer.stop()
        
        # Добавляем флаг для отслеживания активности графика
        self.__is_active = False

    def start_draw(self):
        self.__is_active = True
        self.timer.start()

    def stop_draw(self):
        self.timer.stop()
        self.__is_active = False
        # Принудительно обновляем виджет для корректного завершения отрисовки
        if hasattr(self, 'graphWidget'):
            self.graphWidget.repaint()
    
    def cleanup(self):
        """Метод для безопасной очистки ресурсов графика"""
        self.stop_draw()
        # Отключаем все сигналы
        if hasattr(self, 'timer'):
            try:
                self.timer.timeout.disconnect()
            except (TypeError, RuntimeError):
                # Сигнал уже отключен или таймер удален
                pass
        # Очищаем данные графика
        if hasattr(self, 'line'):
            try:
                self.line.clear()
            except RuntimeError:
                # График уже удален
                pass
        # Очищаем виджет графика
        if hasattr(self, 'graphWidget'):
            try:
                self.graphWidget.clear()
            except RuntimeError:
                # Виджет уже удален
                pass

    def update_data(self, spectrum):
        if not self.__is_active:
            return
        for i in range(len(spectrum)):
            self.xAx[i] = spectrum[i]

    def __draw_plot(self):
        if not self.__is_active:
            return
        try:
            self.line.setData(self.yAx, self.xAx)
            # Принудительно перерисовываем график
        except RuntimeError as e:
            # Игнорируем ошибки, связанные с уже удалёнными объектами
            if "wrapped C/C++ object" in str(e):
                pass
            else:
                raise