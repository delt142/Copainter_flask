import { loadConfig } from './config.js';
import { clearCanvas } from './canvas.js';
import './tools.js';
import './shapes.js';
import './state.js';
import './generate.js';

// Дополнительная логика, если необходимо

// Например, инициализация приложения при загрузке страницы
window.onload = () => {
    loadConfig();
    clearCanvas();
};
