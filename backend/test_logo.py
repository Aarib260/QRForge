"""
Test logo embedding in the QR code.
Run with:  python test_logo.py
"""

from PIL import Image, ImageDraw
import io
from qr_render import generate_qr_png

# Make a fake circular logo so we don't need a real image file yet
logo = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
draw = ImageDraw.Draw(logo)
draw.ellipse([10, 10, 190, 190], fill=(230, 57, 70, 255))
buf = io.BytesIO()
logo.save(buf, format="PNG")

png = generate_qr_png(
    "https://qrforge.app",
    fill_color="#000000",
    back_color="#ffffff",
    box_size=10,
    logo_bytes=buf.getvalue(),
)
with open("test_logo.png", "wb") as f:
    f.write(png)
print("done, size:", len(png), "-> saved as test_logo.png")