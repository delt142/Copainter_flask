const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 600;

let drawing = false;
let penSize = 2;
let penColor = 'black';

document.getElementById('pencil').addEventListener('click', () => {
    penColor = 'black';
    setSelected('pencil');
});

document.getElementById('eraser').addEventListener('click', () => {
    penColor = 'white';
    setSelected('eraser');
});

document.getElementById('clear').addEventListener('click', clearCanvas);

document.getElementById('brushSize').addEventListener('input', (event) => {
    penSize = event.target.value;
});

canvas.addEventListener('mousedown', (event) => {
    drawing = true;
    draw(event);
});

canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);

function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

    ctx.lineTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setSelected(buttonId) {
    document.querySelectorAll('button').forEach(button => button.classList.remove('selected'));
    document.getElementById(buttonId).classList.add('selected');
}

document.getElementById('generate').addEventListener('click', () => {
    const dataUrl = canvas.toDataURL();
    const style = document.getElementById('styles').value;

    fetch('http://localhost:5000/generate', {
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
