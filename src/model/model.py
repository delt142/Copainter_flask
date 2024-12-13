import os
import os.path as op
import datetime
import random

import PIL.Image
import torch
import torchvision.transforms.functional as TF

from diffusers import ControlNetModel, StableDiffusionXLControlNetPipeline, AutoencoderKL, StableDiffusionPipeline, DDIMScheduler, EulerAncestralDiscreteScheduler
from diffusers.utils import load_image
from PIL import Image, ImageOps
import numpy as np

MAX_SEED = np.iinfo(np.int32).max
style_list = [
    {
        "name": "(No style)",
        "prompt": "{prompt}",
        "negative_prompt": "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
    },
    {
        "name": "Cinematic",
        "prompt": "cinematic still {prompt} . emotional, harmonious, vignette, highly detailed, high budget, bokeh, cinemascope, moody, epic, gorgeous, film grain, grainy",
        "negative_prompt": "anime, cartoon, graphic, text, painting, crayon, graphite, abstract, glitch, deformed, mutated, ugly, disfigured",
    },
    {
        "name": "3D Model",
        "prompt": "professional 3d model {prompt} . octane render, highly detailed, volumetric, dramatic lighting",
        "negative_prompt": "ugly, deformed, noisy, low poly, blurry, painting",
    },
    {
        "name": "Anime",
        "prompt": "anime artwork {prompt} . anime style, key visual, vibrant, studio anime,  highly detailed",
        "negative_prompt": "photo, deformed, black and white, realism, disfigured, low contrast",
    },
    {
        "name": "Digital Art",
        "prompt": "concept art {prompt} . digital artwork, illustrative, painterly, matte painting, highly detailed",
        "negative_prompt": "photo, photorealistic, realism, ugly",
    },
    {
        "name": "Photographic",
        "prompt": "cinematic photo {prompt} . 35mm photograph, film, bokeh, professional, 4k, highly detailed",
        "negative_prompt": "drawing, painting, crayon, sketch, graphite, impressionist, noisy, blurry, soft, deformed, ugly",
    },
    {
        "name": "Pixel art",
        "prompt": "pixel-art {prompt} . low-res, blocky, pixel art style, 8-bit graphics",
        "negative_prompt": "sloppy, messy, blurry, noisy, highly detailed, ultra textured, photo, realistic",
    },
    {
        "name": "Fantasy art",
        "prompt": "ethereal fantasy concept art of  {prompt} . magnificent, celestial, ethereal, painterly, epic, majestic, magical, fantasy art, cover art, dreamy",
        "negative_prompt": "photographic, realistic, realism, 35mm film, dslr, cropped, frame, text, deformed, glitch, noise, noisy, off-center, deformed, cross-eyed, closed eyes, bad anatomy, ugly, disfigured, sloppy, duplicate, mutated, black and white",
    },
    {
        "name": "Neonpunk",
        "prompt": "neonpunk style {prompt} . cyberpunk, vaporwave, neon, vibes, vibrant, stunningly beautiful, crisp, detailed, sleek, ultramodern, magenta highlights, dark purple shadows, high contrast, cinematic, ultra detailed, intricate, professional",
        "negative_prompt": "painting, drawing, illustration, glitch, deformed, mutated, cross-eyed, ugly, disfigured",
    },
    {
        "name": "Manga",
        "prompt": "manga style {prompt} . vibrant, high-energy, detailed, iconic, Japanese comic style",
        "negative_prompt": "ugly, deformed, noisy, blurry, low contrast, realism, photorealistic, Western comic style",
    },
]

styles = {k["name"]: (k["prompt"], k["negative_prompt"]) for k in style_list}
STYLE_NAMES = list(styles.keys())
DEFAULT_STYLE_NAME = "(No style)"

def apply_style(style_name: str, positive: str, negative: str = "") -> tuple[str, str]:
    p, n = styles.get(style_name, styles[DEFAULT_STYLE_NAME])
    return p.replace("{prompt}", positive), n + negative

# def randomize_seed_fn(seed: int, randomize_seed: bool) -> int:
#     if randomize_seed:
#         seed = random.randint(0, MAX_SEED)
#     return seed

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

class Model:
    def __init__(self, model_choice="gpu_default") -> None:
        self.model_choice = model_choice
        if model_choice == "gpu_default":
            # Остальной код инициализации для других моделей
            self.controlnet = ControlNetModel.from_pretrained(
                "xinsir/controlnet-scribble-sdxl-1.0",
                torch_dtype=torch.float16
            )

            self.vae = AutoencoderKL.from_pretrained("madebyollin/sdxl-vae-fp16-fix",
                                                     torch_dtype=torch.float16)

            self.pipe = StableDiffusionXLControlNetPipeline.from_pretrained(
                "sd-community/sdxl-flash",
                controlnet=self.controlnet,
                vae=self.vae,
                torch_dtype=torch.float16,
            )
            self.pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(
                self.pipe.scheduler.config
            )

        # elif model_choice == "simple":
        #     self.pipe = StableDiffusionPipeline.from_pretrained(
        #         "CompVis/stable-diffusion-v1-4",
        #         torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        #     )
        #
        # elif model_choice == "gpu_alt1":
        #     self.pipe = StableDiffusionPipeline.from_pretrained(
        #         "runwayml/stable-diffusion-v1-5",
        #         torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        #     )
        # elif model_choice == "gpu_alt2":
        #     self.pipe = StableDiffusionPipeline.from_pretrained(
        #         "stabilityai/stable-diffusion-2-base",
        #         torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
        #     )
        # elif model_choice == "cpu_default":
        #     self.pipe = StableDiffusionPipeline.from_pretrained(
        #         "CompVis/stable-diffusion-v1-4",
        #         torch_dtype=torch.float32  # Используем float32 для совместимости с CPU
        #     )
        # elif model_choice == "cpu_alt1":
        #     self.pipe = StableDiffusionPipeline.from_pretrained(
        #         "stabilityai/stable-diffusion-2-1-base",
        #         torch_dtype=torch.float32  # Используем float32 для совместимости с CPU
        #     )
        # elif model_choice == "cpu_alt2":
        #     self.pipe = StableDiffusionPipeline.from_pretrained(
        #         "huggingface/dalle-mini",
        #         torch_dtype=torch.float32  # Используем float32 для совместимости с CPU
        #     )
        self.pipe.scheduler = DDIMScheduler.from_config(self.pipe.scheduler.config)
        self.pipe.to(device)

    def run(
            self,
            image: PIL.Image.Image,
            prompt: str = '',
            negative_prompt: str = '',
            style_name: str = DEFAULT_STYLE_NAME,
            num_steps: int = 25,
            guidance_scale: float = 5,
            controlnet_conditioning_scale: float = 1.0,
            seed: int = 0,
    ) -> PIL.Image.Image:

        if self.model_choice.startswith("gpu") and torch.cuda.is_available():
            image = image.convert("RGB").resize((512, 512))
        else:
            image = image.convert("RGB").resize((256, 256))  # Уменьшение размера для ускорения на CPU

        # Проверка использования начального изображения
        initial_image_path = f'images/{style_name}/{str(datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S"))}_initial.png'
        image.save(initial_image_path)

        prompt, negative_prompt = apply_style(style_name, prompt, negative_prompt)

        generator = torch.Generator(device=device).manual_seed(seed)
        print(prompt)
        print(negative_prompt)
        if self.model_choice.startswith("cpu"):
            out = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=image,  # Используем image для инициализации
                num_inference_steps=num_steps,
                generator=generator,
                guidance_scale=guidance_scale,
            ).images[0]
        else:
            out = self.pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                image=image,  # Используем image для инициализации
                num_inference_steps=num_steps,
                generator=generator,
                controlnet_conditioning_scale=controlnet_conditioning_scale,
                guidance_scale=guidance_scale,
            ).images[0]

        # Сохранение после генерации
        generated_image_path = f'images/{style_name}/{str(datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S"))}_generated.png'
        out.save(generated_image_path)

        return out.resize((600, 600))






