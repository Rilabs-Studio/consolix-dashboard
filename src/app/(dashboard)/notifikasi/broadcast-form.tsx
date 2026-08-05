"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBroadcast, previewAudience } from "@/server/actions/ops";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";

export function BroadcastForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [pending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 font-medium text-slate-900">Broadcast Baru</p>
      <form
        ref={formRef}
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            fd.set("mode", mode);
            const result = await createBroadcast(fd);
            if (result.error) setError(result.error);
            else {
              formRef.current?.reset();
              setCount(null);
              router.refresh();
            }
          })
        }
        className="grid gap-3 lg:grid-cols-2"
      >
        <div>
          <Label>Judul</Label>
          <Input name="title" required placeholder="mis. Promo Akhir Pekan!" />
        </div>
        <div>
          <Label>Deep Link (opsional)</Label>
          <Input name="deepLink" placeholder="consolix://promo" />
        </div>
        <div className="lg:col-span-2">
          <Label>Isi Pesan</Label>
          <Textarea name="body" rows={3} required placeholder="Isi notifikasi…" />
        </div>
        <div>
          <Label>Audiens</Label>
          <div className="flex items-center gap-2">
            <Select name="audienceType" defaultValue="all" className="flex-1">
              <option value="all">Semua user aktif</option>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                const fd = new FormData(formRef.current ?? undefined);
                startTransition(async () => {
                  const result = await previewAudience(fd);
                  if (result.error) setError(result.error);
                  else setCount(result.count ?? 0);
                });
              }}
            >
              Hitung Target
            </Button>
            {count !== null && (
              <span className="text-sm text-slate-600">{count} penerima</span>
            )}
          </div>
        </div>
        <div>
          <Label>Waktu Kirim</Label>
          <div className="flex items-center gap-2">
            <Select
              value={mode}
              onChange={(e) => setMode(e.target.value as "now" | "schedule")}
              className="w-40"
            >
              <option value="now">Kirim sekarang</option>
              <option value="schedule">Jadwalkan</option>
            </Select>
            {mode === "schedule" && (
              <Input type="datetime-local" name="scheduledAt" required className="flex-1" />
            )}
          </div>
        </div>
        {error && <p className="text-sm text-red-600 lg:col-span-2">{error}</p>}
        <div className="lg:col-span-2">
          <SubmitButton>{mode === "now" ? "Kirim Broadcast" : "Jadwalkan Broadcast"}</SubmitButton>
        </div>
      </form>
    </div>
  );
}
