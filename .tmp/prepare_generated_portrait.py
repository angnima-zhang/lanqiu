import sys
from pathlib import Path

from PIL import Image


generated_path = Path(sys.argv[1])
reference_path = Path(sys.argv[2])
destination_path = Path(sys.argv[3])

generated = Image.open(generated_path)
if "A" not in generated.getbands():
    raise SystemExit("generated image has no alpha channel")

alpha = generated.getchannel("A")
if alpha.histogram()[0] == 0:
    raise SystemExit("generated image has no fully transparent pixels")

reference = Image.open(reference_path)
destination_path.parent.mkdir(parents=True, exist_ok=True)
generated.convert("RGBA").resize(reference.size, Image.Resampling.NEAREST).save(destination_path)

result = Image.open(destination_path)
result_alpha = result.getchannel("A")
print(
    f"saved={destination_path}\n"
    f"size={result.size}\n"
    f"mode={result.mode}\n"
    f"transparent={result_alpha.histogram()[0]}"
)
