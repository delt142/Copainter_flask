import { loadConfig } from './config.js';
import { clearCanvas } from './canvas.js';
import './tools.js';
import './state.js';
import './generate.js';


window.onload = () => {
    loadConfig();
    clearCanvas();
};
