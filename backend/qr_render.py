"""
Renders a QR payload string into a PNG or SVG image,
with optional fill color, background color, logo overlay, and size.
"""

import io
import base64
import qrcode
import qrcode.image.svg
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image


def generate_qr_png(
    payload: str,
    fill_color: str = "#000000",
    back_color: str = "#FFFFFF",
    box_size: int = 10,
    border: int = 4,
    logo_bytes: bytes | None = None,
) -> bytes:
    """Returns raw PNG bytes."""

    # If embedding a logo, bump error correction to HIGH so the code
    # still scans even with a chunk covered by the logo.
    error_correction = ERROR_CORRECT_H if logo_bytes else qrcode.constants.ERROR_CORRECT_M

    qr = qrcode.QRCode(
        version=None,  # auto-size to fit data
        error_correction=error_correction,
        box_size=box_size,
        border=border,
    )
    qr.add_data(payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color=fill_color, back_color=back_color).convert("RGB")

    if logo_bytes:
        img = _embed_logo(img, logo_bytes)

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_qr_svg(
    payload: str,
    fill_color: str = "#000000",
    back_color: str = "#FFFFFF",
    border: int = 4,
) -> bytes:
    """Returns raw SVG bytes. Note: logo embedding in SVG is skipped —
    recommend PNG download when a logo is used."""

    factory = qrcode.image.svg.SvgPathImage
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        border=border,
        image_factory=factory,
    )
    qr.add_data(payload)
    qr.make(fit=True)

    img = qr.make_image(fill_color=fill_color, back_color=back_color)
    buf = io.BytesIO()
    img.save(buf)
    return buf.getvalue()


def _embed_logo(qr_img: Image.Image, logo_bytes: bytes) -> Image.Image:
    """Pastes a logo in the center of the QR code, sized to ~22% of the QR width
    (small enough that ERROR_CORRECT_H can still recover the covered modules)."""

    logo = Image.open(io.BytesIO(logo_bytes)).convert("RGBA")

    qr_w, qr_h = qr_img.size
    logo_size = int(qr_w * 0.22)
    logo = logo.resize((logo_size, logo_size), Image.LANCZOS)

    # White backing square behind the logo so it's legible on any QR color
    pad = int(logo_size * 0.12)
    backing = Image.new("RGBA", (logo_size + pad * 2, logo_size + pad * 2), "white")
    backing.paste(logo, (pad, pad), logo)

    pos = ((qr_w - backing.width) // 2, (qr_h - backing.height) // 2)
    qr_img = qr_img.convert("RGBA")
    qr_img.paste(backing, pos, backing)
    return qr_img.convert("RGB")


def to_base64_data_uri(png_bytes: bytes) -> str:
    encoded = base64.b64encode(png_bytes).decode("ascii")
    return f"data:image/png;base64,{encoded}"