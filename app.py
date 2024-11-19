from flask import Flask, render_template, request, jsonify
import os
from datetime import datetime
from PIL import Image
import base64
import io
import torch
from torchvision import transforms
from diffusers import StableDiffusionPipeline

app = Flask(__name__)

# Путь для сохранения модели локально
MODEL_PATH = "models/stable-diffusion"

# Проверка наличия модели и ее загрузка
def load_model():
    if not os.path.exists(MODEL_PATH):
        os.makedirs(MODEL_PATH, exist_ok=True)
    # Загрузка модели и сохранение в указанную директорию
    if not os.path.exists(os.path.join(MODEL_PATH, "diffusion_pytorch_model.bin")):
        pipe = StableDiffusionPipeline.from_pretrained("CompVis/stable-diffusion-v1-4", cache_dir=MODEL_PATH)
        pipe.save_pretrained(MODEL_PATH)
    else:
        pipe = StableDiffusionPipeline.from_pretrained(MODEL_PATH)
    return pipe

device = "cuda" if torch.cuda.is_available() else "cpu"
pipe = load_model().to(device)

# Преобразование изображений
def transform_image(image, style):
    preprocess = transforms.Compose([
        transforms.Resize((512, 512)),
        transforms.ToTensor(),
        transforms.Normalize([0.5], [0.5])
    ])
    image_tensor = preprocess(image).unsqueeze(0).to(device)
    result = pipe(prompt=f"{style} style", init_image=image_tensor, num_inference_steps=30, guidance_scale=7.5).images[0]
    result = result.resize((600, 600))
    return result

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_image():
    data = request.form['image']
    style = request.form['style']
    data = data.split(',')[1]
    image_data = base64.b64decode(data)
    image = Image.open(io.BytesIO(image_data))

    # Преобразование изображения с помощью Stable Diffusion
    transformed_image = transform_image(image, style)

    # Сохранение изображений
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    os.makedirs(f"images/{style}", exist_ok=True)
    before_path = f"images/{style}/before_{timestamp}.png"
    after_path = f"images/{style}/after_{timestamp}.png"
    image.save(before_path)
    transformed_image.save(after_path)

    return jsonify({'status': 'success', 'before': before_path, 'after': after_path})

if __name__ == '__main__':
    app.run(debug=True)
