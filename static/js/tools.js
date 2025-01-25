import { canvas, ctx } from './canvas.js';
import { saveState, undo, redo } from './state.js';

export let penSize = 2;
export let penColor = 'black';
let drawing = false;
let isLineMode = false;
let startPoint = null;
let savedImageData = null;
let touchStartTime = null;

const brushSizeInput = document.getElementById('brushSize');
const brushSizeIndicator = document.getElementById('brushSizeIndicator');
const brushSizeText = document.getElementById('brushSizeText');

function updateBrushSizeIndicator() {
    const size = Math.min(penSize, 24);  // Ограничиваем максимальный размер индикатора

    brushSizeIndicator.style.width = `${size}px`;
    brushSizeIndicator.style.height = `${size}px`;
    brushSizeIndicator.style.backgroundColor = penColor === 'white' ? 'transparent' : penColor;
    brushSizeText.textContent = `${penSize}`;
}

brushSizeInput.addEventListener('input', (event) => {
    penSize = event.target.value;
    updateBrushSizeIndicator();
});

document.getElementById('colorPicker').addEventListener('input', (event) => {
    penColor = event.target.value;
    updateBrushSizeIndicator();
});

document.getElementById('generate').addEventListener('click', () => {
    // Строка saveSketch была удалена
});

function setSelected(buttonId) {
    document.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    document.getElementById(buttonId).classList.add('selected');
}

document.getElementById('pencil').addEventListener('click', () => {
    penColor = 'black';
    isLineMode = false;
    setSelected('pencil');
    updateBrushSizeIndicator();
});

document.getElementById('eraser').addEventListener('click', () => {
    penColor = 'white';  // Ластик рисует белым
    isLineMode = false;
    setSelected('eraser');
    updateBrushSizeIndicator();
});

// Функция очистки холста
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';  // Устанавливаем белый фон после очистки
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();  // Сохраняем состояние после очистки
}

document.getElementById('clear').addEventListener('click', () => {
    clearCanvas();
});

document.getElementById('line').addEventListener('click', () => {
    isLineMode = true;
    setSelected('line');
});

document.getElementById('undo').addEventListener('click', () => {
    undo();
});

document.getElementById('redo').addEventListener('click', () => {
    redo();
});

canvas.addEventListener('mousedown', (event) => {
    if (savedImageData) {
        saveState();
    }

    const x = event.offsetX;
    const y = event.offsetY;
    touchStartTime = new Date().getTime();

    if (isLineMode) {
        startPoint = { x, y };
        savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
});

canvas.addEventListener('mousemove', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    if (drawing) {
        if (isLineMode) {
            restoreCanvas();
            drawLine({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        } else {
            draw({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        }
    }
});

canvas.addEventListener('mouseup', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const touchEndTime = new Date().getTime();

    if (isLineMode && startPoint) {
        restoreCanvas();
        drawLine({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
    } else if (!isLineMode && (touchEndTime - touchStartTime < 200)) {
        // Если короткое нажатие, ставим точку
        drawDot({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
    }

    drawing = false;
    startPoint = null;
    saveState();
});

canvas.addEventListener('touchstart', (event) => {
    saveState();
    const touch = event.touches[0];
    const x = touch.clientX - canvas.offsetLeft;
    const y = touch.clientY - canvas.offsetTop;
    touchStartTime = new Date().getTime();

    if (isLineMode) {
        startPoint = { x, y };
        savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    }
});

canvas.addEventListener('touchmove', (event) => {
    if (event.cancelable) {
        event.preventDefault(); // Предотвращение скроллинга
    }

    const touch = event.touches[0];
    const x = touch.clientX - canvas.offsetLeft;
    const y = touch.clientY - canvas.offsetTop;

    if (drawing) {
        if (isLineMode) {
            restoreCanvas();
            drawLine({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        } else {
            draw({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        }
    }
});

canvas.addEventListener('touchend', (event) => {
    const touch = event.changedTouches[0];
    const x = touch.clientX - canvas.offsetLeft;
    const y = touch.clientY - canvas.offsetTop;
    const touchEndTime = new Date().getTime();

    if (isLineMode && startPoint) {
        restoreCanvas();
        drawLine({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
    } else if (!isLineMode && (touchEndTime - touchStartTime < 200)) {
        // Если короткое нажатие, ставим точку
        drawDot({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
    }

    drawing = false;
    startPoint = null;
    saveState();
});

function draw(event) {
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.moveTo(x, y);
}

function drawLine(event) {
    if (!startPoint) return;
    const currentX = event.clientX - canvas.offsetLeft;
    const currentY = event.clientY - canvas.offsetTop;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
}

function drawDot(event) {
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    ctx.fillStyle = penColor;
    ctx.beginPath();
    ctx.arc(x, y, penSize / 2, 0, Math.PI * 2, true);
    ctx.fill();
}

function restoreCanvas() {
    if (savedImageData) {
        ctx.putImageData(savedImageData, 0, 0);
    }
}
