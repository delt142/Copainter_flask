document.getElementById('languageSwitcher').addEventListener('change', (event) => {
    const language = event.target.value;
    if (language === 'ru') {
        document.getElementById('pencil').textContent = 'Карандаш';
        document.getElementById('eraser').textContent = 'Ластик';
        document.getElementById('clear').textContent = 'Очистить';
        document.getElementById('line').textContent = 'Прямая';
        document.getElementById('undo').textContent = 'Отмена';
        document.getElementById('redo').textContent = 'Вернуть';
        document.getElementById('generate').textContent = 'Сгенерировать изображение';
    } else {
        document.getElementById('pencil').textContent = 'Pencil';
        document.getElementById('eraser').textContent = 'Eraser';
        document.getElementById('clear').textContent = 'Clear';
        document.getElementById('line').textContent = 'Line';
        document.getElementById('undo').textContent = 'Undo';
        document.getElementById('redo').textContent = 'Redo';
        document.getElementById('generate').textContent = 'Generate Image';
    }
});
