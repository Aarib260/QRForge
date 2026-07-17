"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import {
  previewQR,
  downloadQR,
  saveQR,
  getHistory,
  deleteHistoryItem,
  QRType,
  QRHistoryItem,
} from "@/lib/api";
import { QR_TYPES, COLOR_PRESETS } from "@/lib/constants";
import QRDetailModal from "@/components/QRDetailModal";

type FormData = Record<string, string>;

export default function Home() {
  const [qrType, setQrType] = useState<QRType>("url");
  const [formData, setFormData] = useState<FormData>({});
  const [fillColor, setFillColor] = useState("#FF6B35");
  const [backColor, setBackColor] = useState("#14120F");
  const [size, setSize] = useState(10);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [payload, setPayload] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const [copied, setCopied] = useState(false);

  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<QRHistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QRHistoryItem | null>(null);

  function updateField(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function resetFormForType(type: QRType) {
    setQrType(type);
    setFormData({});
    setPreviewImage(null);
    setPayload("");
  }

  const runPreview = useCallback(async () => {
    // basic guard: don't fire a request for a totally empty form
    const hasAnyValue = Object.values(formData).some((v) => v && v.trim() !== "");
    if (!hasAnyValue) {
      setPreviewImage(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await previewQR({
        qr_type: qrType,
        data: formData,
        fill_color: fillColor,
        back_color: backColor,
        size,
        format: "png",
      });
      setPreviewImage(res.image || null);
      setPayload(res.payload);
      setPulse((p) => p + 1);
    } catch (e: any) {
      if (e instanceof TypeError) {
        setError("Can't reach the server — make sure your backend is running on port 8000.");
      } else {
        setError(e.message || "Something went wrong generating the preview");
      }
    } finally {
      setLoading(false);
    }
  }, [qrType, formData, fillColor, backColor, size]);

  // debounce preview generation as the user types
  useEffect(() => {
    const t = setTimeout(runPreview, 450);
    return () => clearTimeout(t);
  }, [runPreview]);

  // auto-clear the save confirmation/error message after a few seconds
  useEffect(() => {
    if (!saveMsg) return;
    const t = setTimeout(() => setSaveMsg(null), 3000);
    return () => clearTimeout(t);
  }, [saveMsg]);

  // auto-clear the "Copied!" payload feedback
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setLogo(file);
    if (file) setLogoPreview(URL.createObjectURL(file));
    else setLogoPreview(null);
  }

  async function handleDownload(format: "png" | "svg") {
    try {
      const blob = await downloadQR({
        qr_type: qrType,
        data: formData,
        fill_color: fillColor,
        back_color: backColor,
        size,
        format,
        logo,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `qrforge-${qrType}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e.message || "Download failed");
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveQR({
        qr_type: qrType,
        data: formData,
        label: label || undefined,
        fill_color: fillColor,
        back_color: backColor,
        size,
      });
      setSaveMsg("Saved to history.");
      setLabel("");
    } catch (e: any) {
      setSaveMsg(e.message || "Couldn't save — check your backend is running.");
    } finally {
      setSaving(false);
    }
  }

  async function loadHistory() {
    try {
      const res = await getHistory();
      setHistory(res.history || []);
      setHistoryOpen(true);
    } catch (e: any) {
      setError(e.message || "Couldn't load history");
    }
  }

  async function handleDeleteHistory(id: number, e: React.MouseEvent) {
    e.stopPropagation(); // don't also trigger the card's onClick (opening the modal)
    await deleteHistoryItem(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <main className="min-h-screen px-6 py-10 md:px-12 lg:px-20">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-bone">
            QR<span className="text-ember">Forge</span>
          </h1>
          <p className="mt-1 text-sm text-bone/50">Forge a code. Any payload, any shape.</p>
        </div>
        <button
          onClick={loadHistory}
          className="rounded-md border border-steelLight px-4 py-2 text-sm text-bone/80 transition hover:border-ember hover:text-ember"
        >
          History
        </button>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        {/* LEFT: form */}
        <section>
          {/* type selector */}
          <div className="mb-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {QR_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => resetFormForType(t.value)}
                className={`flex flex-col items-center gap-2 rounded-lg border px-3 py-4 transition ${
                  qrType === t.value
                    ? "border-ember bg-ember/10 shadow-ember"
                    : "border-steelLight bg-steel/40 hover:border-bone/30 hover:bg-steel/70"
                }`}
              >
                <span className="text-2xl">{t.icon}</span>
                <span
                  className={`text-xs font-medium ${
                    qrType === t.value ? "text-ember" : "text-bone/70"
                  }`}
                >
                  {t.label}
                </span>
              </button>
            ))}
          </div>

          {/* dynamic fields */}
          <div className="space-y-4">
            {qrType === "url" && (
              <Field label="Website URL">
                <input
                  type="text"
                  placeholder="example.com"
                  value={formData.url || ""}
                  onChange={(e) => updateField("url", e.target.value)}
                  className="forge-input"
                />
              </Field>
            )}

            {qrType === "text" && (
              <Field label="Text">
                <textarea
                  placeholder="Type anything..."
                  value={formData.text || ""}
                  onChange={(e) => updateField("text", e.target.value)}
                  className="forge-input min-h-[100px]"
                />
              </Field>
            )}

            {qrType === "wifi" && (
              <>
                <Field label="Network name (SSID)">
                  <input
                    type="text"
                    value={formData.ssid || ""}
                    onChange={(e) => updateField("ssid", e.target.value)}
                    className="forge-input"
                  />
                </Field>
                {formData.security !== "nopass" && (
                  <Field label="Password">
                    <input
                      type="text"
                      value={formData.password || ""}
                      onChange={(e) => updateField("password", e.target.value)}
                      className="forge-input"
                    />
                  </Field>
                )}
                <Field label="Security">
                  <select
                    value={formData.security || "WPA"}
                    onChange={(e) => updateField("security", e.target.value)}
                    className="forge-input"
                  >
                    <option value="WPA">WPA/WPA2</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">No password</option>
                  </select>
                </Field>
              </>
            )}

            {qrType === "contact" && (
              <>
                <Field label="Full name">
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => updateField("name", e.target.value)}
                    className="forge-input"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    type="text"
                    value={formData.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="forge-input"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="text"
                    value={formData.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="forge-input"
                  />
                </Field>
                <Field label="Organization (optional)">
                  <input
                    type="text"
                    value={formData.org || ""}
                    onChange={(e) => updateField("org", e.target.value)}
                    className="forge-input"
                  />
                </Field>
              </>
            )}

            {qrType === "email" && (
              <>
                <Field label="To">
                  <input
                    type="text"
                    value={formData.to || ""}
                    onChange={(e) => updateField("to", e.target.value)}
                    className="forge-input"
                  />
                </Field>
                <Field label="Subject">
                  <input
                    type="text"
                    value={formData.subject || ""}
                    onChange={(e) => updateField("subject", e.target.value)}
                    className="forge-input"
                  />
                </Field>
                <Field label="Body">
                  <textarea
                    value={formData.body || ""}
                    onChange={(e) => updateField("body", e.target.value)}
                    className="forge-input min-h-[80px]"
                  />
                </Field>
              </>
            )}

            {qrType === "location" && (
              <>
                <Field label="Latitude">
                  <input
                    type="text"
                    placeholder="33.6844"
                    value={formData.lat || ""}
                    onChange={(e) => updateField("lat", e.target.value)}
                    className="forge-input"
                  />
                </Field>
                <Field label="Longitude">
                  <input
                    type="text"
                    placeholder="73.0479"
                    value={formData.lng || ""}
                    onChange={(e) => updateField("lng", e.target.value)}
                    className="forge-input"
                  />
                </Field>
              </>
            )}
          </div>

          {/* customization */}
          <div className="mt-8 border-t border-steelLight pt-6">
            <h3 className="mb-4 font-display text-sm font-medium uppercase tracking-wide text-bone/50">
              Customize
            </h3>
            <div className="flex flex-wrap items-end gap-6">
              <div>
                <label className="mb-1.5 block text-xs text-bone/50">QR color</label>
                <input
                  type="color"
                  value={fillColor}
                  onChange={(e) => setFillColor(e.target.value)}
                  className="h-9 w-14"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-bone/50">Background</label>
                <input
                  type="color"
                  value={backColor}
                  onChange={(e) => setBackColor(e.target.value)}
                  className="h-9 w-14"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-bone/50">Presets</label>
                <div className="flex gap-1.5">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      title={p.name}
                      onClick={() => {
                        setFillColor(p.fill);
                        setBackColor(p.back);
                      }}
                      className="h-9 w-9 rounded-md border border-steelLight transition hover:border-ember"
                      style={{ background: `linear-gradient(135deg, ${p.fill} 50%, ${p.back} 50%)` }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="mb-1.5 block text-xs text-bone/50">Size — {size}</label>
                <input
                  type="range"
                  min={4}
                  max={20}
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full accent-ember"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-bone/50">Logo (PNG download only)</label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-steelLight bg-steel px-4 py-2 text-sm text-bone/80 transition hover:border-ember hover:text-ember">
                  <span>{logo ? "Change logo" : "Choose logo"}</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
                {logo && (
                  <p className="mt-1.5 max-w-[180px] truncate text-xs text-bone/40">{logo.name}</p>
                )}
              </div>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-ember">{error}</p>}
        </section>

        {/* RIGHT: forge plate preview */}
        <section className="flex flex-col items-center">
          <div
            key={pulse}
            className="forge-plate animate-glow flex aspect-square w-full max-w-[360px] items-center justify-center rounded-lg p-8"
          >
            {previewImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewImage} alt="Generated QR code" className="h-full w-full object-contain" />
            ) : loading ? (
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-steelLight border-t-ember" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="text-4xl opacity-20">▦</span>
                <p className="text-sm text-bone/30">Fill in the fields to see your code</p>
              </div>
            )}
          </div>

          {logoPreview && (
            <p className="mt-2 text-xs text-bone/40">
              Logo will be embedded in the downloaded PNG (not shown in this live preview)
            </p>
          )}

          {payload && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(payload);
                setCopied(true);
              }}
              title="Click to copy"
              className="mt-4 max-w-full overflow-x-auto rounded-md border border-transparent bg-plate px-3 py-2 text-left font-mono text-xs text-amber/80 transition hover:border-ember"
            >
              {copied ? "Copied!" : payload}
            </button>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => handleDownload("png")}
              disabled={!previewImage}
              className="rounded-md bg-ember px-5 py-2.5 text-sm font-medium text-soot transition hover:bg-amber disabled:cursor-not-allowed disabled:opacity-30"
            >
              Download PNG
            </button>
            <button
              onClick={() => handleDownload("svg")}
              disabled={!previewImage}
              className="rounded-md border border-steelLight px-5 py-2.5 text-sm text-bone/80 transition hover:border-bone/40 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Download SVG
            </button>
          </div>

          <div className="mt-6 flex w-full max-w-[360px] gap-2">
            <input
              type="text"
              placeholder="Label (e.g. Office WiFi)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="forge-input flex-1 text-sm"
            />
            <button
              onClick={handleSave}
              disabled={!previewImage || saving}
              className="whitespace-nowrap rounded-md border border-steelLight px-4 py-2 text-sm text-bone/80 transition hover:border-ember hover:text-ember disabled:opacity-30"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
          {saveMsg && <p className="mt-2 text-xs text-bone/50">{saveMsg}</p>}
        </section>
      </div>

      {/* history drawer */}
      {historyOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="h-full w-full max-w-sm overflow-y-auto bg-plate p-6 border-l border-steelLight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-bone">My QR Codes</h2>
              <button onClick={() => setHistoryOpen(false)} className="text-bone/50 hover:text-ember">
                ✕
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-bone/40">No saved codes yet.</p>
            ) : (
              <ul className="space-y-4">
                {history.map((h) => (
                  <li
                    key={h.id}
                    onClick={() => setSelectedItem(h)}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-steelLight p-3 transition hover:border-ember/60 hover:bg-steel/30"
                  >
                    {h.image_base64 && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={h.image_base64}
                        alt={h.label || h.qr_type}
                        className="h-12 w-12 rounded bg-white p-1"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-bone">{h.label || h.qr_type}</p>
                      <p className="text-xs text-bone/40">
                        {new Date(h.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteHistory(h.id, e)}
                      className="text-xs text-bone/40 hover:text-ember"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* QR detail modal — AnimatePresence drives the enter/exit animation
          as selectedItem toggles between an item and null */}
      <AnimatePresence>
        {selectedItem && (
          <QRDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-bone/50">{label}</label>
      {children}
    </div>
  );
}