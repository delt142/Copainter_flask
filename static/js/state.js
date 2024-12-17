import { canvas, ctx } from './canvas.js';

let undoStack = [];
let redoStack = [];

export function saveState() {
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 20) {
        undoStack.shift();
    }
    redoStack = [];
}

export function undo() {
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
        };
    }
}
export function redo() {
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
        };
    }
}
export { undoStack, redoStack };

document.getElementById('undo').addEventListener('click', () => {
    undo();
});

document.getElementById('redo').addEventListener('click', () => {
    redo();
});
