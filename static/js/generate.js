import { canvas } from './canvas.js';

document.getElementById('generate').addEventListener('click', async () => {
    const button = document.getElementById('generate');
    const dataUrl = canvas.toDataURL('image/png');
    const style = document.getElementById('styles').value;

    // Заблокировать кнопку и изменить текст
    button.disabled = true;
    button.innerText = 'Generating...';

    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ image: dataUrl.split(',')[1], style: style })
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            document.getElementById('result').src = url;
        } else {
            console.error('Ошибка генерации изображения');
        }
    } catch (error) {
        console.error('Произошла ошибка:', error);
    } finally {
        // Разблокировать кнопку и вернуть исходный текст
        button.disabled = false;
        button.innerText = 'Generate Image';
    }
});
