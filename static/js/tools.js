import { config } from './config.js';
import { canvas, ctx } from './canvas.js';
import { saveState, undo, redo, undoStack, redoStack } from './state.js';
import { drawShape, shapes } from './shapes.js';

export let penSize = 2;
export let penColor = 'black';
let drawing = false;
let isLineMode = false;
let isShapeMode = false;
let shapeType = '';
let fillShape = false;
let startPoint = null;
let savedImageData = null;
let selectedShape = null;
let touchStartTime = null;

const brushSizeInput = document.getElementById('brushSize');
const brushSizeIndicator = document.getElementById('brushSizeIndicator');

function updateBrushSizeIndicator() {
    brushSizeIndicator.style.width = `${penSize}px`;
    brushSizeIndicator.style.height = `${penSize}px`;
    brushSizeIndicator.style.display = 'inline-block';
    brushSizeIndicator.style.backgroundColor = penColor;
    brushSizeIndicator.style.borderRadius = '50%';
    brushSizeIndicator.style.border = '1px solid black';
}

brushSizeInput.addEventListener('input', (event) => {
    penSize = event.target.value;
    updateBrushSizeIndicator();
});

document.getElementById('colorPicker').addEventListener('input', (event) => {
    penColor = event.target.value;
    updateBrushSizeIndicator();
});

document.getElementById('saveSketch').addEventListener('click', saveSketch);

document.getElementById('generate').addEventListener('click', () => {
    if (config.blackAndWhite) {
        generateBlackAndWhiteImage();
    } else {
        saveSketch();
    }
});

function setSelected(buttonId) {
    document.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    document.getElementById(buttonId).classList.add('selected');
}

document.getElementById('pencil').addEventListener('click', () => {
    if (config.pencil === 'on') {
        penColor = 'black';
        isLineMode = false;
        isShapeMode = false;
        setSelected('pencil');
        updateBrushSizeIndicator();
    }
});

document.getElementById('eraser').addEventListener('click', () => {
    if (config.eraser === 'on') {
        penColor = 'white';  // Ластик рисует белым
        isLineMode = false;
        isShapeMode = false;
        setSelected('eraser');
        updateBrushSizeIndicator();
    }
});

document.getElementById('clear').addEventListener('click', () => {
    if (config.clear === 'on') {
        clearCanvas();
    }
});

document.getElementById('line').addEventListener('click', () => {
    if (config.line === 'on') {
        isLineMode = true;
        isShapeMode = false;
        setSelected('line');
    }
});

document.getElementById('shapes').addEventListener('change', (event) => {
    if (config[event.target.value] === 'on') {
        isShapeMode = true;
        shapeType = event.target.value;
        setSelected('shapes');
    }
});

document.getElementById('fill').addEventListener('click', () => {
    if (config.fill === 'on') {
        fillShape = !fillShape;
        setSelected('fill');
    }
});

document.getElementById('undo').addEventListener('click', () => {
    if (config.undo === 'on') {
        undo();
    }
});

document.getElementById('redo').addEventListener('click', () => {
    if (config.redo === 'on') {
        redo();
    }
});

//const eventsToBlock = [
//    'pointerdown',
//    'mousedown',
//    'pointerup',
//    'mouseup',
//    'pointermove',
//    'mousemove',
//    'pointerover',
//    'mouseover',
//    'pointerout',
//    'mouseout',
//    'pointerenter',
//    'mouseenter',
//    'pointerleave',
//    'mouseleave',
//    'pointercancel',
//    'gotpointercapture',
//    'lostpointercapture'
//];
//
//eventsToBlock.forEach(event => {
//    document.addEventListener(event, function(e) {
//        e.preventDefault(); // предотвращает действие по умолчанию
//        e.stopPropagation(); // останавливает дальнейшую обработку события
//    }, true); // true для захвата события
//});


canvas.addEventListener('mousedown', (event) => {
    if (shapes.length > 0 || savedImageData) {
        saveState();
    }

    const x = event.offsetX;
    const y = event.offsetY;
    touchStartTime = new Date().getTime();

    if (isLineMode || isShapeMode) {
        startPoint = { x, y };
        savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    selectedShape = shapes.find(shape => isPointInShape(shape, x, y));
    if (selectedShape) {
        selectedShape.offsetX = x - selectedShape.x;
        selectedShape.offsetY = y - selectedShape.y;
    }
});

canvas.addEventListener('mousemove', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    if (drawing) {
        if (isLineMode || isShapeMode) {
            restoreCanvas();
            drawShape({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        } else {
            draw({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        }
    } else if (selectedShape) {
        restoreCanvas();
        selectedShape.x = x - selectedShape.offsetX;
        selectedShape.y = y - selectedShape.offsetY;
        drawAllShapes();
    }
});

canvas.addEventListener('mouseup', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const touchEndTime = new Date().getTime();

    if (isLineMode && startPoint) {
        restoreCanvas();
        drawLine({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
    } else if (!isLineMode && !isShapeMode && (touchEndTime - touchStartTime < 200)) {
        // Если короткое нажатие, ставим точку
        drawDot({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
    }

    drawing = false;
    startPoint = null;
    selectedShape = null;
    saveState();
});

canvas.addEventListener('touchstart', (event) => {
    saveState();
    const touch = event.touches[0];
    const x = touch.clientX - canvas.offsetLeft;
    const y = touch.clientY - canvas.offsetTop;
    touchStartTime = new Date().getTime();

    if (isLineMode || isShapeMode) {
        startPoint = { x, y };
        savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    } else {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    selectedShape = shapes.find(shape => isPointInShape(shape, x, y));
    if (selectedShape) {
        selectedShape.offsetX = x - selectedShape.x;
        selectedShape.offsetY = y - selectedShape.y;
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
        } else if (isShapeMode) {
            restoreCanvas();
            drawShape({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        } else {
            draw({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
        }
    } else if (selectedShape) {
        restoreCanvas();
        selectedShape.x = x - selectedShape.offsetX;
        selectedShape.y = y - selectedShape.offsetY;
        drawAllShapes();
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
    } else if (!isLineMode && !isShapeMode && (touchEndTime - touchStartTime < 200)) {
        // Если короткое нажатие, ставим точку
        drawDot({ clientX: x + canvas.offsetLeft, clientY: y + canvas.offsetTop });
    }

    drawing = false;
    startPoint = null;
    selectedShape = null;
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

function isPointInShape(shape, x, y) {
    switch (shape.type) {
        case 'circle':
            const radius = Math.sqrt(shape.width * shape.width + shape.height * shape.height);
            return Math.sqrt((x - shape.x) ** 2 + (y - shape.y) ** 2) <= radius;
        case 'star':
            return false;  // Можно реализовать, если необходимо
        default:
            return false;
    }
}

function restoreCanvas() {
    if (savedImageData) {
        ctx.putImageData(savedImageData, 0, 0);
    }
    drawAllShapes();
}

function saveShape(event) {
    const endPoint = { x: event.clientX - canvas.offsetLeft, y: event.clientY - canvas.offsetTop };
    const width = endPoint.x - startPoint.x;
    const height = endPoint.y - startPoint.y;

    const shape = {
        type: shapeType,
        x: startPoint.x,
        y: startPoint.y,
        width: width,
        height: height,
        fillShape: fillShape,
        offsetX: 0,
        offsetY: 0
    };

    shapes.push(shape);
}

function drawAllShapes() {
    shapes.forEach(shape => {
        ctx.lineWidth = penSize;
        ctx.strokeStyle = penColor;
        ctx.fillStyle = penColor;

        switch (shape.type) {
            case 'circle':
                ctx.beginPath();
                ctx.arc(shape.x, shape.y, Math.sqrt(shape.width * shape.width + shape.height * shape.height), 0, Math.PI * 2);
                if (shape.fillShape) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                break;
            case 'star':
                drawStar(ctx, shape.x, shape.y, 5, Math.sqrt(shape.width * shape.width + shape.height * shape.height) / 2, Math.sqrt(shape.width * shape.width + shape.height * shape.height));
                break;
            case 'square':
                ctx.beginPath();
                ctx.rect(shape.x, shape.y, shape.width, shape.height);
                if (shape.fillShape) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                break;
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(shape.x, shape.y);
                ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
                ctx.lineTo(shape.x - shape.width, shape.y + shape.height);
                ctx.closePath();
                if (shape.fillShape) {
                    ctx.fill();
                } else {
                    ctx.stroke();
                }
                break;
        }
    });
}

// Helper function to draw a star
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    if (fillShape) {
        ctx.fill();
    } else {
        ctx.stroke();
    }
}

// Очистка холста и истории действий
function clearCanvas() {
    undoStack.length = 0;
    redoStack.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';  // Устанавливаем белый фон после очистки
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    shapes.length = 0;
    savedImageData = null;
}

// Сохранение эскиза с черным цветом для всех непрозрачных пикселей
function saveSketch() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Проверяем, если цвет не белый (255, 255, 255)
        if (!(r === 255 && g === 255 && b === 255)) {
            data[i] = 0;     // Красный
            data[i + 1] = 0; // Зеленый
            data[i + 2] = 0; // Синий
        }
    }

    ctx.putImageData(imageData, 0, 0);

//    // Сохраняем изображение
//    const link = document.createElement('a');
//    link.download = 'sketch.png';
//    link.href = canvas.toDataURL();
//    link.click();

    // Восстанавливаем исходное изображение
    ctx.putImageData(imageData, 0, 0);
}

// Генерация черно-белого изображения
function generateBlackAndWhiteImage() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Проверяем, если цвет не белый (255, 255, 255)
        if (!(r === 255 && g === 255 && b === 255)) {
            data[i] = 0;     // Красный
            data[i + 1] = 0; // Зеленый
            data[i + 2] = 0; // Синий
        }
    }

    ctx.putImageData(imageData, 0, 0);


    // Восстанавливаем исходное изображение
    ctx.putImageData(imageData, 0, 0);
}
