import os
import os.path as op
import datetime
import json
import random

import PIL.Image
import torch
import torchvision.transforms.functional as TF
from diffusers import (
    ControlNetModel,
    StableDiffusionXLControlNetPipeline,
    AutoencoderKL,
    StableDiffusionPipeline,
    DDIMScheduler,
    EulerAncestralDiscreteScheduler
)
from diffusers.utils import load_image
from PIL import Image, ImageOps
import numpy as np

MAX_SEED = np.iinfo(np.int32).max

# Загрузка конфигурации
with open('static/config.json', 'r') as f:
    config = json.load(f)

style_file = config.get('style_file', 'static/config/styles_Fantasy_Epic.json')

# Загрузка списка стилей из JSON файла
with open(style_file, 'r') as f:
    style_list = json.load(f)

styles = {k["name"]: (k["prompt"], k["negative_prompt"]) for k in style_list}
STYLE_NAMES = list(styles.keys())
DEFAULT_STYLE_NAME = "(No style)"


def apply_style(style_name: str, positive: str, negative: str = "") -> tuple[str, str]:
    p, n = styles.get(style_name, styles[DEFAULT_STYLE_NAME])
    return p.replace("{prompt}", positive), n + negative


device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class Model:
    def __init__(self, model_choice="gpu_default") -> None:
        self.model_choice = model_choice
        if model_choice == "gpu_default":
            self.controlnet = ControlNetModel.from_pretrained(
                "xinsir/controlnet-scribble-sdxl-1.0",
                torch_dtype=torch.float16
            )
            self.vae = AutoencoderKL.from_pretrained(
                "madebyollin/sdxl-vae-fp16-fix",
                torch_dtype=torch.float16
            )
            self.pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
                "sd-community/sdxl-flash",
                controlnet=self.controlnet,
                vae=self.vae,
                torch_dtype=torch.float16,
            )
            # Устанавливаем планировщик
            self.pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(
                self.pipe.scheduler.config
            )
            # Включаем память-эффективное внимание
            self.pipe.enable_xformers_memory_efficient_attention()
            # Устанавливаем переменную окружения для уменьшения фрагментации памяти
            os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
        # Переносим пайплайн на нужное устройство
        # self.pipe.to(device)
        # self.pipe.enable_model_cpu_offload()
        # self.pipe.gradient_checkpointing_enable()
        # self.pipe.enable_attention_slicing("auto")

        self.pipe.to("cuda").to(torch.float16)

    def run(
            self,
            image: PIL.Image.Image,
            prompt: str = '',
            negative_prompt: str = '',
            style_name: str = DEFAULT_STYLE_NAME,
            num_steps: int = 25,
            guidance_scale: float = 3,
            controlnet_conditioning_scale: float = 1.0,
            seed: int = None,
    ) -> PIL.Image.Image:
        torch.cuda.empty_cache()
        image = PIL.ImageOps.invert(image.convert("RGB").resize((700, 700)))
        torch.cuda.empty_cache()
        # Проверка и создание директории для сохранения изображений
        style_directory = op.join('images', style_name)
        if not os.path.exists(style_directory):
            os.makedirs(style_directory)
        torch.cuda.empty_cache()
        initial_image_path = f'{style_directory}/{datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")}_initial.png'
        image.save(initial_image_path)
        torch.cuda.empty_cache()
        prompt, negative_prompt = apply_style(style_name, prompt, negative_prompt)
        if seed is None:
            seed = random.randint(0, MAX_SEED)
        generator = torch.Generator(device=device).manual_seed(seed)
        torch.cuda.empty_cache()
        with torch.no_grad():
            out = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=image,
                num_inference_steps=num_steps,
                generator=generator,
                controlnet_conditioning_scale=controlnet_conditioning_scale,
                guidance_scale=guidance_scale,
            ).images[0]

        torch.cuda.empty_cache()
        generated_image_path = f'{style_directory}/{datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S")}_generated.png'
        torch.cuda.empty_cache()
        out.save(generated_image_path)
        del image, prompt, negative_prompt, generator
        torch.cuda.empty_cache()
        return out.resize((700, 700))

