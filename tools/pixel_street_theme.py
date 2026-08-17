from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from PIL import Image


ROOT = Path(r"D:\篮球")
REFERENCE = ROOT / "新设计" / "视觉基准" / "招募结果_像素街球视觉母版.png"


@lru_cache(maxsize=8)
def reference_palette(colors: int = 128) -> Image.Image:
    """Build a fixed palette from the approved recruitment-result master image."""
    ref = Image.open(REFERENCE).convert("RGB")
    ref.thumbnail((512, 1024), Image.Resampling.BOX)
    quantized = ref.quantize(colors=colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    palette = Image.new("P", (1, 1))
    palette.putpalette(quantized.getpalette())
    return palette


def pixel_finish(image: Image.Image, grid: int = 2, colors: int = 128) -> Image.Image:
    """Force integer pixels, a reference-derived palette, and hard alpha edges."""
    src = image.convert("RGBA")
    width, height = src.size
    small_size = (max(1, width // grid), max(1, height // grid))

    alpha = src.getchannel("A")
    rgb = Image.new("RGB", src.size, (255, 255, 255))
    rgb.paste(src.convert("RGB"), mask=alpha)
    small_rgb = rgb.resize(small_size, Image.Resampling.BOX)
    small_rgb = small_rgb.quantize(palette=reference_palette(colors), dither=Image.Dither.NONE).convert("RGB")
    pixel_rgb = small_rgb.resize((width, height), Image.Resampling.NEAREST)

    small_alpha = alpha.resize(small_size, Image.Resampling.BOX).point(lambda value: 255 if value >= 112 else 0)
    pixel_alpha = small_alpha.resize((width, height), Image.Resampling.NEAREST)
    result = pixel_rgb.convert("RGBA")
    result.putalpha(pixel_alpha)
    return result

