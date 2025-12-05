from PyQt6 import QtCore, QtWidgets
from PyQt6.QtWidgets import QWidget
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
        self.timer = QtCore.QTimer()
        self.timer.setInterval(60)
        self.timer.timeout.connect(self.__draw_signal)

    def start_draw(self):
        self.timer.start()

    def stop_draw(self):
        self.timer.stop()

    def update_data(self, signal):
        for sample in signal:
            self.yAx.pop(0)
            self.yAx.append(self.yAx[-1] + 1)
            self.xAx.pop(0)
            self.xAx.append(sample)

    def __draw_signal(self):
        self.graphWidget.setXRange(self.yAx[0], self.yAx[-1])
        self.line.setData(self.yAx, self.xAx)


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
        self.timer = QtCore.QTimer()
        self.timer.setInterval(60)
        self.timer.timeout.connect(self.__draw_plot)

    def start_draw(self):
        self.timer.start()

    def stop_draw(self):
        self.timer.stop()

    def update_data(self, spectrum):
        for i in range(len(spectrum)):
            self.xAx[i] = spectrum[i]

    def __draw_plot(self):
        self.line.setData(self.yAx, self.xAx)