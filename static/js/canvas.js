export const canvas = document.getElementById('drawingCanvas');
export const ctx = canvas.getContext('2d', { willReadFrequently: true });
canvas.width = 600;
canvas.height = 600;

// Инициализация белого фона
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

export function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';  // Устанавливаем белый фон после очистки
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
