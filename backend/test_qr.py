"""
Quick sanity test for QRForge's payload builder and image renderer.
Run with:  python test_qr.py
"""

from qr_payloads import build_payload
from qr_render import generate_qr_png, generate_qr_svg

# --- Test payload building ---
p1 = build_payload("url", {"url": "example.com"})
print("URL payload:", p1)

p2 = build_payload("wifi", {"ssid": "My Net;work", "password": "pa:ss", "security": "WPA"})
print("WiFi payload:", p2)

p3 = build_payload("contact", {"name": "Aarib Khan", "phone": "+1234567890", "email": "a@b.com"})
print("Contact payload:")
print(p3)

# --- Test PNG generation ---
png = generate_qr_png(p1, fill_color="#1a1a2e", back_color="#ffffff", box_size=10)
with open("test_url.png", "wb") as f:
    f.write(png)
print("PNG size:", len(png), "bytes -> saved as test_url.png")

# --- Test SVG generation ---
svg = generate_qr_svg(p2)
print("SVG size:", len(svg), "bytes")

print("ALL TESTS PASSED")