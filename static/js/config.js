export let config = {};

export async function loadConfig() {
    const response = await fetch('/static/config.json');
    config = await response.json();
    applyConfig();
}

async function loadStyles() {
    const response = await fetch(config.style_file);
    const styles = await response.json();
    const stylesSelect = document.getElementById('styles');
    styles.forEach(style => {
        const option = document.createElement('option');
        option.value = style.name;
        option.textContent = style.name;
        stylesSelect.appendChild(option);
    });
}

function applyConfig() {
    for (const [key, value] of Object.entries(config)) {
        const button = document.getElementById(key);
        if (button) {
            button.style.display = value === 'on' ? 'inline-block' : 'none';
        }
    }
    const shapesSelect = document.getElementById('shapes');
    let showShapesSelect = false;

    for (let i = 0; i < shapesSelect.options.length; i++) {
        const option = shapesSelect.options[i];
        if (config[option.value] === 'on') {
            showShapesSelect = true;
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    }

    shapesSelect.style.display = showShapesSelect ? 'inline-block' : 'none';

    // Применение параметров colorize и blackAndWhite
    if (!config.colorize) {
        document.getElementById('colorPicker').style.display = 'none';
    }

    // Загрузка стилей после применения конфигурации
    loadStyles();
}

// Загрузка конфигурации при загрузке страницы
window.onload = loadConfig;
