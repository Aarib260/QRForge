"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { QRHistoryItem } from "@/lib/api";
import { getTypeMeta } from "@/lib/constants";

interface QRDetailModalProps {
  item: QRHistoryItem | null;
  onClose: () => void;
}

/**
 * Full-detail view for a single saved QR code.
 * Rendered by the parent inside <AnimatePresence>, so `item` toggling
 * between a value and null drives the enter/exit animation.
 */
export default function QRDetailModal({ item, onClose }: QRDetailModalProps) {
  const [copied, setCopied] = useState(false);

  // close on Escape key, for keyboard users / desktop convenience
  useEffect(() => {
    if (!item) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [item, onClose]);

  // reset the "copied" flag whenever a different item is opened
  useEffect(() => {
    setCopied(false);
  }, [item]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  if (!item) return null;

  const typeMeta = getTypeMeta(item.qr_type);
  const createdAt = new Date(item.created_at);
  const formattedDate = createdAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = createdAt.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  function handleDownload() {
    if (!item) return;
    const a = document.createElement("a");
    a.href = item.image_base64;
    a.download = `qrforge-${item.qr_type}-${item.id}.png`;
    a.click();
  }

  function handleCopyPayload() {
    if (!item) return;
    navigator.clipboard.writeText(item.payload);
    setCopied(true);
  }

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        className="forge-plate relative w-full max-w-md rounded-lg p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* close (X) */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-lg text-bone/50 transition hover:text-ember"
        >
          ✕
        </button>

        {/* QR image */}
        <div className="mx-auto mb-5 flex w-full max-w-[220px] items-center justify-center rounded-md bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_base64}
            alt={item.label || `${typeMeta.label} QR code`}
            className="h-full w-full object-contain"
          />
        </div>

        {/* label + type */}
        <div className="mb-4 text-center">
          <h2 id="qr-modal-title" className="font-display text-lg font-bold text-bone">
            {item.label || `Untitled ${typeMeta.label}`}
          </h2>
          <p className="mt-1 text-sm text-bone/50">
            <span className="mr-1.5">{typeMeta.icon}</span>
            {typeMeta.label}
          </p>
        </div>

        {/* metadata */}
        <div className="mb-4 space-y-3 border-t border-steelLight pt-4">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-bone/40">Payload</p>
            <p className="max-h-24 overflow-y-auto break-all rounded-md bg-plate px-3 py-2 font-mono text-xs text-amber/80">
              {item.payload}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-bone/40">Created</p>
            <p className="text-sm text-bone/70">
              {formattedDate} at {formattedTime}
            </p>
          </div>
        </div>

        {/* actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={handleDownload}
            className="flex-1 rounded-md bg-ember px-4 py-2.5 text-sm font-medium text-soot transition hover:bg-amber"
          >
            Download QR
          </button>
          <button
            onClick={handleCopyPayload}
            className="flex-1 rounded-md border border-steelLight px-4 py-2.5 text-sm text-bone/80 transition hover:border-ember hover:text-ember"
          >
            {copied ? "Copied!" : "Copy Payload"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-steelLight px-4 py-2.5 text-sm text-bone/60 transition hover:border-bone/40 sm:flex-none sm:px-5"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}