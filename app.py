from flask import Flask, request, render_template, send_file, jsonify
from flask_cors import CORS
from PIL import Image, ImageOps
import io
import base64
import json
from src.model import Model
from waitress import serve
import os
import os.path as op
import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)  # Разрешаем кросс-доменные запросы

# Загрузка конфигурации
with open('static/config.json', 'r') as f:
    config = json.load(f)

model_choice = config.get('model', 'gpu_default')
model_instance = Model(model_choice=model_choice)


@app.route('/')
def index():
    # Шаблон index.html должен подключать скомпилированное Vue-приложение
    return render_template('index.html')

@app.route('/styles', methods=['GET'])
def get_styles():
    with open('static/config/styles1.json', 'r') as f:
        styles = json.load(f)
    return json.dumps(styles), 200, {'Content-Type': 'application/json'}

@app.route('/generate', methods=['POST'])
def generate_image():
    data = request.json
    # Декодируем изображение из base64
    image_data = base64.b64decode(data['image'])
    image = Image.open(io.BytesIO(image_data)).convert("RGBA")

    # Заменяем белый фон на прозрачный (если пиксели равны 255,255,255)
    datas = image.getdata()
    new_data = []
    for item in datas:
        if item[:3] == (255, 255, 255):
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    image.putdata(new_data)

    # Сохраняем изображение в RGB перед передачей в модель
    image = image.convert("RGB")
    style = data['style']

    generated_image = model_instance.run(image, style_name=style)
    img_io = io.BytesIO()
    generated_image.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')

if __name__ == '__main__':
    serve(app, host="127.0.0.1", port=8000)
