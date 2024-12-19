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
    {
        "name": "Dreamlike",
        "prompt": "dreamlike {prompt} . ethereal, surreal, soft light, pastel colors, whimsical, magical, fantasy, delicate, airy, luminous",
        "negative_prompt": "realistic, dark, harsh, violent, grotesque, dull, muted"
    },
    {
        "name": "Cyberpunk",
        "prompt": "cyberpunk {prompt} . futuristic, neon lights, dystopian, gritty, high-tech, cityscape, dark, cybernetics, urban, vibrant",
        "negative_prompt": "natural, soft, pastoral, historic, rustic, organic"
    },
    {
        "name": "Vintage",
        "prompt": "vintage {prompt} . sepia tones, old-fashioned, nostalgic, retro, film grain, warm colors, 1960s, timeless, antique, classic",
        "negative_prompt": "modern, futuristic, neon, cold, digital, new"
    },
    {
        "name": "Mystic Forest",
        "prompt": "mystic forest {prompt} . enchanted, misty, dense foliage, magical, twilight, ancient, serene, mystical, mysterious, lush",
        "negative_prompt": "urban, barren, clear, man-made, desolate"
    },
    {
        "name": "Steampunk",
        "prompt": "steampunk {prompt} . Victorian, industrial, gears, steam-powered, brass, ornate, alternate history, mechanical, adventurous, intricate",
        "negative_prompt": "high-tech, futuristic, minimalistic, clean, streamlined"
    },
    {
        "name": "Fantasy Epic",
        "prompt": "fantasy epic {prompt} . heroic, grand, mythical, detailed, vibrant, epic scale, magical creatures, medieval, adventure, dramatic",
        "negative_prompt": "mundane, contemporary, small-scale, realistic, ordinary"
    },
    {
        "name": "Abstract",
        "prompt": "abstract {prompt} . geometric, colorful, non-representational, dynamic, bold, expressive, modern art, patterns, shapes, experimental",
        "negative_prompt": "realistic, detailed, literal, figurative, traditional"
    },
    {
        "name": "Noir",
        "prompt": "noir {prompt} . black and white, high contrast, shadows, moody, crime, 1940s, dramatic lighting, mystery, urban, vintage",
        "negative_prompt": "bright, colorful, cheerful, contemporary, peaceful"
    },
    {
        "name": "Celestial",
        "prompt": "celestial {prompt} . stars, galaxies, cosmic, ethereal, otherworldly, luminous, night sky, mystical, universe, stellar",
        "negative_prompt": "earthly, mundane, terrestrial, ordinary, grounded"
    },
    {
        "name": "Industrial",
        "prompt": "industrial {prompt} . urban decay, factories, machinery, gritty, dark, high contrast, metallic, rust, dystopian, raw",
        "negative_prompt": "natural, clean, pristine, untouched, scenic"
    },
    {
        "name": "Monochromatic",
        "prompt": "monochromatic {prompt} . one color, tonal variations, minimalistic, simple, elegant, consistent, unified, subtle, stylish, focused",
        "negative_prompt": "multicolored, complex, chaotic, varied, mixed"
    },
{
    "name": "Surrealism",
    "prompt": "surrealism {prompt} . dreamlike, fantastical, bizarre, unexpected, juxtaposition, imaginative, whimsical, mind-bending, artistic, eccentric",
    "negative_prompt": "realistic, ordinary, predictable, natural, conventional"
},
{
    "name": "Gothic",
    "prompt": "gothic {prompt} . dark, mysterious, ornate, eerie, historical, dramatic, shadows, architecture, melancholy, supernatural",
    "negative_prompt": "bright, modern, plain, cheerful, straightforward"
},
{
    "name": "Neon Dreams",
    "prompt": "neon dreams {prompt} . vibrant, glowing, colorful, futuristic, nightlife, urban, electrifying, bold, high-energy, psychedelic",
    "negative_prompt": "dull, muted, natural, understated, organic"
},
{
    "name": "Pastel Paradise",
    "prompt": "pastel paradise {prompt} . soft colors, light, airy, gentle, harmonious, serene, dreamy, delicate, whimsical, charming",
    "negative_prompt": "harsh, bold, dark, intense, stark"
},
{
    "name": "Sci-Fi",
    "prompt": "sci-fi {prompt} . futuristic, high-tech, outer space, advanced, sleek, innovative, alien, robotic, speculative, adventurous",
    "negative_prompt": "historic, natural, ordinary, simple, mundane"
},
{
    "name": "Romantic",
    "prompt": "romantic {prompt} . soft, warm, intimate, candlelight, dreamy, sentimental, tender, heartfelt, gentle, classic",
    "negative_prompt": "harsh, cold, impersonal, modern, detached"
},
{
    "name": "Minimalist",
    "prompt": "minimalist {prompt} . simple, clean, uncluttered, elegant, modern, sleek, sophisticated, refined, focused, understated",
    "negative_prompt": "complex, chaotic, detailed, ornate, busy"
},
]

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
        self.pipe.scheduler = EulerAncestralDiscreteScheduler.from_config(self.pipe.scheduler.config)
        self.pipe.to(device)

    def run(
            self,
            image: PIL.Image.Image,
            prompt: str = '',
            negative_prompt: str = '',
            style_name: str = DEFAULT_STYLE_NAME,
            num_steps: int = 25,
            guidance_scale: float = 3,
            controlnet_conditioning_scale: float = 1.0,
            seed: int = 0,
    ) -> PIL.Image.Image:
        image = PIL.ImageOps.invert(image.convert("RGB").resize((1024, 1024)))
        initial_image_path = f'images/{style_name}/{str(datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S"))}_initial.png'
        image.save(initial_image_path)

        prompt, negative_prompt = apply_style(style_name, prompt, negative_prompt)

        generator = torch.Generator(device=device).manual_seed(seed)
        print(prompt)
        print(negative_prompt)
        out = self.pipe(
            prompt=prompt,
            negative_prompt=negative_prompt,
            image=image,
            num_inference_steps=num_steps,
            generator=generator,
            controlnet_conditioning_scale=controlnet_conditioning_scale,
            guidance_scale=guidance_scale,
        ).images[0]


        generated_image_path = f'images/{style_name}/{str(datetime.datetime.now().strftime("%Y-%m-%d %H-%M-%S"))}_generated.png'
        out.save(generated_image_path)

        return out.resize((600, 600))
