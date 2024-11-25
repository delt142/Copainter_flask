from flask import Flask, request, render_template, send_file
from flask_cors import CORS
from PIL import Image, ImageOps
import io
import base64
from src.model import Model

app = Flask(__name__)
CORS(app)  # Разрешаем кросс-доменные запросы

model_instance = Model()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/generate', methods=['POST'])
def generate_image():
    data = request.json
    image_data = base64.b64decode(data['image'])
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    image = ImageOps.invert(image)  # Инвертируем изображение для правильной обработки

    style = data['style']
    generated_image = model_instance.run(image, style_name=style)

    img_io = io.BytesIO()
    generated_image.save(img_io, 'PNG')
    img_io.seek(0)
    return send_file(img_io, mimetype='image/png')


if __name__ == '__main__':
    app.run(debug=True)
