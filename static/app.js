const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

// Инициализация белого фона
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let config = {};

// Функция для загрузки конфигурации
async function loadConfig() {
    const response = await fetch('/static/config.json');
    config = await response.json();
    applyConfig();
}

// Применение конфигурации
function applyConfig() {
    for (const [key, value] of Object.entries(config)) {
        const button = document.getElementById(key);
        if (button) {
            button.style.display = value === 'on' ? 'inline-block' : 'none';
        }
    }
}

let drawing = false;
let penSize = 2;
let penColor = 'black';
let isLineMode = false;
let isShapeMode = false;
let shapeType = '';
let fillShape = false;
let startPoint = null;
let savedImageData = null;
let shapes = [];
let selectedShape = null;

let undoStack = [];
let redoStack = [];

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
//////////////////////////////////////////////////////////////
canvas.addEventListener('pointerdown', (event) => {
    saveState();
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;

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

canvas.addEventListener('pointermove', (event) => {
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;

    if (drawing) {
        if (isLineMode) {
            restoreCanvas();
            drawLine(event);
        } else if (isShapeMode) {
            restoreCanvas();
            drawShape(event);
        } else {
            draw(event);
        }
    } else if (selectedShape) {
        restoreCanvas();
        selectedShape.x = x - selectedShape.offsetX;
        selectedShape.y = y - selectedShape.y;
        drawAllShapes();
    }
});

canvas.addEventListener('pointerup', (event) => {
    if (isLineMode && startPoint) {
        restoreCanvas();
        drawLine(event);
    } else if (isShapeMode && startPoint) {
        restoreCanvas();
        drawShape(event);
        saveShape(event);
    }
    drawing = false;
    startPoint = null;
    selectedShape = null;
    saveState();
});
canvas.addEventListener('pointerout', () => {
    drawing = false;
    selectedShape = null;
});

canvas.addEventListener('pointerenter', (event) => {
    if (event.buttons === 1 && !isLineMode && !isShapeMode) {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    }
});

canvas.addEventListener('pointerleave', (event) => {
    console.log("leave")
    event.preventDefault()

});

//////////////////////////////////////////////////////////////
//canvas.addEventListener('mousedown', (event) => {
//    saveState();
//    const x = event.clientX - canvas.offsetLeft;
//    const y = event.clientY - canvas.offsetTop;
//
//    if (isLineMode || isShapeMode) {
//        startPoint = { x, y };
//        savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
//    } else {
//        drawing = true;
//        ctx.beginPath();
//        ctx.moveTo(x, y);
//    }
//
//    selectedShape = shapes.find(shape => isPointInShape(shape, x, y));
//    if (selectedShape) {
//        selectedShape.offsetX = x - selectedShape.x;
//        selectedShape.offsetY = y - selectedShape.y;
//    }
//});
//
//canvas.addEventListener('mousemove', (event) => {
//    const x = event.clientX - canvas.offsetLeft;
//    const y = event.clientY - canvas.offsetTop;
//
//    if (drawing) {
//        if (isLineMode) {
//            restoreCanvas();
//            drawLine(event);
//        } else if (isShapeMode) {
//            restoreCanvas();
//            drawShape(event);
//        } else {
//            draw(event);
//        }
//    } else if (selectedShape) {
//        restoreCanvas();
//        selectedShape.x = x - selectedShape.offsetX;
//        selectedShape.y = y - selectedShape.y;
//        drawAllShapes();
//    }
//});
//
//canvas.addEventListener('mouseup', (event) => {
//    if (isLineMode && startPoint) {
//        restoreCanvas();
//        drawLine(event);
//    } else if (isShapeMode && startPoint) {
//        restoreCanvas();
//        drawShape(event);
//        saveShape(event);
//    }
//    drawing = false;
//    startPoint = null;
//    selectedShape = null;
//    saveState();
//});
//
//canvas.addEventListener('mouseout', () => {
//    drawing = false;
//    selectedShape = null;
//});
//
//canvas.addEventListener('mouseenter', (event) => {
//    if (event.buttons === 1 && !isLineMode && !isShapeMode) {
//        drawing = true;
//        ctx.beginPath();
//        ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
//    }
//});

function draw(event) {
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop );
    ctx.stroke();
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

function drawLine(event) {
    if (!startPoint) return;
    const currentX = event.clientX - canvas.offsetLeft;
    const currentY = event.clientY - canvas.offsetTop;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

//    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
}

function drawShape(event) {
    if (!startPoint) return;
    const endPoint = { x: event.clientX - canvas.offsetLeft, y: event.clientY - canvas.offsetTop };
    const width = endPoint.x - startPoint.x;
    const height = endPoint.y - startPoint.y;

    ctx.lineWidth = penSize;
    ctx.strokeStyle = penColor;
    ctx.fillStyle = penColor;

    switch (shapeType) {
        case 'circle':
            ctx.beginPath();
            ctx.arc(startPoint.x, startPoint.y, Math.sqrt(width * width + height * height), 0, Math.PI * 2);
            if (fillShape) {
                ctx.fill();
            } else {
                ctx.stroke();
            }
            break;
        case 'star':
            drawStar(ctx, startPoint.x, startPoint.y, 5, Math.sqrt(width * width + height * height) / 2, Math.sqrt(width * width + height * height) / 4);
            break;
    }
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
                drawStar(ctx, shape.x, shape.y, 5, Math.sqrt(shape.width * shape.width + shape.height * shape.height) / 2, Math.sqrt(shape.width * shape.width + shape.height * shape.height))
                break;
        }
    });
}

function restoreCanvas() {
    if (savedImageData) {
        ctx.putImageData(savedImageData, 0, 0);
    }
//    drawAllShapes();
}

function clearCanvas() {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';  // Устанавливаем белый фон после очистки
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    shapes = [];
}

function setSelected(buttonId) {
    document.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    document.getElementById(buttonId).classList.add('selected');
}

function saveState() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 20) {
        undoStack.shift();
    }
    redoStack = [];
}

function undo() {
    if (undoStack.length > 0) {
        redoStack.push(canvas.toDataURL());
        let previousState = undoStack.pop();
        let img = new Image();
        img.src = previousState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';  // Устанавливаем белый фон после восстановления
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        }
    }
}

function redo() {
    if (redoStack.length > 0) {
        undoStack.push(canvas.toDataURL());
        let nextState = redoStack.pop();
        let img = new Image();
        img.src = nextState;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';  // Устанавливаем белый фон после восстановления
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        }
    }
}

document.getElementById('generate').addEventListener('click', () => {
    const dataUrl = canvas.toDataURL('image/png');
    const style = document.getElementById('styles').value;

    fetch('/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: dataUrl.split(',')[1], style: style })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = URL.createObjectURL(blob);
        document.getElementById('result').src = url;
    });
});

// Загрузка конфигурации при загрузке страницы
window.onload = loadConfig;

