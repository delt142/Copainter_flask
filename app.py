from flask import Flask, request, render_template, send_file
from flask_cors import CORS
from PIL import Image
import io
import base64
import json
from src.model import Model

app = Flask(__name__)
CORS(app)  # Разрешаем кросс-доменные запросы

# Загрузка конфигурации
with open('static/config.json', 'r') as f:
    config = json.load(f)

model_choice = config.get('model', 'gpu_default')
model_instance = Model(model_choice=model_choice)


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/generate', methods=['POST'])
def generate_image():
    data = request.json
    image_data = base64.b64decode(data['image'])
    image = Image.open(io.BytesIO(image_data)).convert("RGBA")

    # Преобразуем белый фон в прозрачный
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
    # prompt = "cinematic still"  # Обобщенный запрос для трансформации эскиза
    # generated_image = model_instance.run(image, prompt=prompt, style_name=style)
    generated_image = model_instance.run(image, style_name=style)
    img_io = io.BytesIO()
    generated_image.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')






if __name__ == '__main__':
    app.run(debug=True)