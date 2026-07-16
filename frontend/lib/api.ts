const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
console.log("API_BASE =", API_BASE);

export type QRType = "url" | "text" | "wifi" | "contact" | "email" | "location";

export interface PreviewResponse {
  image?: string;
  svg?: string;
  payload: string;
}

export async function previewQR(params: {
  qr_type: QRType;
  data: Record<string, string | boolean>;
  fill_color: string;
  back_color: string;
  size: number;
  format: "png" | "svg";
}): Promise<PreviewResponse> {
  const res = await fetch(`${API_BASE}/api/qr/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed to generate preview" }));
    throw new Error(err.error || "Failed to generate preview");
  }
  return res.json();
}

export async function downloadQR(params: {
  qr_type: QRType;
  data: Record<string, string | boolean>;
  fill_color: string;
  back_color: string;
  size: number;
  format: "png" | "svg";
  logo?: File | null;
}): Promise<Blob> {
  const form = new FormData();
  form.append("qr_type", params.qr_type);
  form.append("data", JSON.stringify(params.data));
  form.append("fill_color", params.fill_color);
  form.append("back_color", params.back_color);
  form.append("size", String(params.size));
  form.append("format", params.format);
  if (params.logo) form.append("logo", params.logo);

  const res = await fetch(`${API_BASE}/api/qr/generate`, { method: "POST", body: form });
  if (!res.ok) throw new Error("Failed to generate QR code");
  return res.blob();
}

export async function saveQR(params: {
  qr_type: QRType;
  data: Record<string, string | boolean>;
  label?: string;
  fill_color: string;
  back_color: string;
  size: number;
}) {
  const res = await fetch(`${API_BASE}/api/qr/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Failed to save QR code");
  return res.json();
}

export async function getHistory() {
  const res = await fetch(`${API_BASE}/api/qr/history`);
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

export async function deleteHistoryItem(id: number) {
  const res = await fetch(`${API_BASE}/api/qr/history/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete item");
  return res.json();
}
