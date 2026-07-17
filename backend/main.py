from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Literal
import json
from dotenv import load_dotenv

load_dotenv()  # reads backend/.env and sets DATABASE_URL etc. into os.environ

from qr_payloads import build_payload
from qr_render import generate_qr_png, generate_qr_svg, to_base64_data_uri
from db import init_db
from qr_history import save_qr_record, list_qr_history, delete_qr_record

app = FastAPI(title="QRForge API")

# Allow your Next.js frontend (adjust origins for prod / Vercel domain)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://qr-forge-ey4c.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    """Creates the qr_codes table if it doesn't exist yet."""
    init_db()


class QRRequest(BaseModel):
    qr_type: Literal["url", "text", "wifi", "contact", "email", "location"]
    data: dict = Field(..., description="Type-specific fields, e.g. {'url': 'https://...'}")
    fill_color: str = "#000000"
    back_color: str = "#FFFFFF"
    size: int = Field(10, ge=2, le=40, description="Box size (pixels per QR module)")
    border: int = Field(4, ge=0, le=10)
    format: Literal["png", "svg"] = "png"


@app.post("/api/qr/generate")
async def generate_qr(
    qr_type: str = Form(...),
    data: str = Form(..., description="JSON string of type-specific fields"),
    fill_color: str = Form("#000000"),
    back_color: str = Form("#FFFFFF"),
    size: int = Form(10),
    border: int = Form(4),
    format: str = Form("png"),
    logo: Optional[UploadFile] = File(None),
):
    """
    Generates a QR code. Accepts multipart/form-data so a logo file can be
    uploaded alongside the JSON fields.

    Example `data` field for type="wifi":
        {"ssid": "MyNetwork", "password": "secret123", "security": "WPA"}
    """
    try:
        parsed_data = json.loads(data)
    except json.JSONDecodeError:
        return JSONResponse(status_code=400, content={"error": "`data` must be valid JSON"})

    payload = build_payload(qr_type, parsed_data)

    if not payload:
        return JSONResponse(status_code=400, content={"error": "Empty payload — nothing to encode"})

    logo_bytes = await logo.read() if logo else None

    if format == "svg":
        svg_bytes = generate_qr_svg(payload, fill_color, back_color, border)
        return Response(content=svg_bytes, media_type="image/svg+xml")

    png_bytes = generate_qr_png(
        payload,
        fill_color=fill_color,
        back_color=back_color,
        box_size=size,
        border=border,
        logo_bytes=logo_bytes,
    )
    return Response(content=png_bytes, media_type="image/png")


@app.post("/api/qr/preview")
async def generate_qr_preview(req: QRRequest):
    """
    JSON-only variant (no logo upload) — returns a base64 data URI.
    Handy for live-preview-as-you-type on the frontend without multipart overhead.
    """
    payload = build_payload(req.qr_type, req.data)
    if not payload:
        return JSONResponse(status_code=400, content={"error": "Empty payload — nothing to encode"})

    if req.format == "svg":
        svg_bytes = generate_qr_svg(payload, req.fill_color, req.back_color, req.border)
        return JSONResponse(content={"svg": svg_bytes.decode("utf-8"), "payload": payload})

    png_bytes = generate_qr_png(
        payload,
        fill_color=req.fill_color,
        back_color=req.back_color,
        box_size=req.size,
        border=req.border,
    )
    return JSONResponse(content={"image": to_base64_data_uri(png_bytes), "payload": payload})


class SaveQRRequest(BaseModel):
    qr_type: Literal["url", "text", "wifi", "contact", "email", "location"]
    data: dict
    label: Optional[str] = None
    fill_color: str = "#000000"
    back_color: str = "#FFFFFF"
    size: int = Field(10, ge=2, le=40)
    border: int = Field(4, ge=0, le=10)


@app.post("/api/qr/save")
async def save_qr(req: SaveQRRequest):
    """
    Generates a QR (PNG, no logo support here yet) and saves it to history.
    Frontend calls this when the user clicks "Save" after previewing a QR.
    """
    payload = build_payload(req.qr_type, req.data)
    if not payload:
        return JSONResponse(status_code=400, content={"error": "Empty payload — nothing to encode"})

    png_bytes = generate_qr_png(
        payload,
        fill_color=req.fill_color,
        back_color=req.back_color,
        box_size=req.size,
        border=req.border,
    )
    image_b64 = to_base64_data_uri(png_bytes)

    saved = save_qr_record(
        qr_type=req.qr_type,
        payload=payload,
        image_base64=image_b64,
        label=req.label,
        fill_color=req.fill_color,
        back_color=req.back_color,
        size=req.size,
    )
    return JSONResponse(content={"saved": saved, "image": image_b64})


@app.get("/api/qr/history")
async def get_history(limit: int = 50):
    """Returns saved QR codes, newest first."""
    history = list_qr_history(limit=limit)
    # created_at/expires_at are datetime objects — convert for JSON
    for row in history:
        if row.get("created_at"):
            row["created_at"] = row["created_at"].isoformat()
        if row.get("expires_at"):
            row["expires_at"] = row["expires_at"].isoformat()
    return JSONResponse(content={"history": history})


@app.delete("/api/qr/history/{qr_id}")
async def delete_history_item(qr_id: int):
    """Deletes a single saved QR code by id."""
    deleted = delete_qr_record(qr_id)
    if not deleted:
        return JSONResponse(status_code=404, content={"error": "No record found with that id"})
    return JSONResponse(content={"deleted": qr_id})


@app.get("/health")
async def health():
    return {"status": "ok"}
