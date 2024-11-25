const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

let drawing = false;
let penSize = 2;
let penColor = 'black';
let isLineMode = false;
let startPoint = null;
let savedImageData = null;

let undoStack = [];
let redoStack = [];

document.getElementById('pencil').addEventListener('click', () => {
    penColor = 'black';
    isLineMode = false;
    setSelected('pencil');
});

document.getElementById('eraser').addEventListener('click', () => {
    penColor = 'white';
    isLineMode = false;
    setSelected('eraser');
});

document.getElementById('clear').addEventListener('click', clearCanvas);

document.getElementById('line').addEventListener('click', () => {
    isLineMode = true;
    setSelected('line');
});

document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);

document.getElementById('brushSize').addEventListener('input', (event) => {
    penSize = event.target.value;
});

canvas.addEventListener('mousedown', (event) => {
    saveState();
    if (isLineMode) {
        startPoint = { x: event.clientX - canvas.offsetLeft, y: event.clientY - canvas.offsetTop };
        savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Сохраняем текущее состояние холста
    } else {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    }
});

canvas.addEventListener('mousemove', (event) => {
    if (!drawing) return;
    if (isLineMode) {
        restoreCanvas(); // Восстанавливаем состояние холста перед рисованием линии
        drawLine(event);
    } else {
        draw(event);
    }
});

canvas.addEventListener('mouseup', (event) => {
    if (isLineMode && startPoint) {
        restoreCanvas(); // Восстанавливаем состояние холста перед рисованием линии
        drawLine(event);
    }
    drawing = false;
    startPoint = null;
    saveState();
});

canvas.addEventListener('mouseout', () => {
    drawing = false;
});

canvas.addEventListener('mouseenter', (event) => {
    if (event.buttons === 1 && !isLineMode) {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    }
});

function draw(event) {
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

function drawLine(event) {
    if (!startPoint) return;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
}

function restoreCanvas() {
    if (savedImageData) {
        ctx.putImageData(savedImageData, 0, 0); // Восстанавливаем сохраненное состояние холста
    }
}

function clearCanvas() {
    saveState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
