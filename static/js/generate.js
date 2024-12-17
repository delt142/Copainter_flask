import { canvas } from './canvas.js';

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
