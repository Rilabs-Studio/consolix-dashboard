"use client";

import { useRef, useState } from "react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { presignUpload, type UploadFolder } from "@/server/actions/uploads";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/** Mirrors the backend's STORAGE_MAX_UPLOAD_MB (the host rejects bigger files). */
const MAX_UPLOAD_MB = 5;

/**
 * Image field that submits a URL under [name] (default `imageUrl`). The admin
 * can paste a URL or click "Unggah Foto": the file is uploaded directly to
 * object storage via a backend presigned URL, and the resulting public URL is
 * written into the field. Drop-in replacement for `<Input name="imageUrl" …>`.
 */
export function ImageUploadInput({
  name = "imageUrl",
  folder,
  defaultValue = "",
  label = "Gambar (opsional)",
}: {
  name?: string;
  folder: UploadFolder;
  defaultValue?: string;
  label?: string;
}) {
  const [url, setUrl] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-selected later
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("Format harus JPG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { uploadUrl, publicUrl } = await presignUpload({
        folder,
        contentType: file.type,
      });
      let res: Response;
      try {
        res = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      } catch {
        // A network-level failure on the direct PUT is almost always the
        // bucket's CORS policy not allowing this dashboard origin — the
        // browser hides the real status behind a generic TypeError.
        throw new Error(
          `Upload diblokir dari ${window.location.origin} — origin ini belum ` +
            "diizinkan di CORS bucket (jalankan scripts/set-bucket-cors.cjs di repo backend).",
        );
      }
      if (!res.ok) throw new Error(`Upload gagal (HTTP ${res.status})`);
      setUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Pratinjau" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-xs text-slate-400">
              Tidak ada
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          <Input
            name={name}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… atau unggah file"
          />
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={handleFile}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {busy ? "Mengunggah…" : "Unggah Foto"}
            </Button>
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
