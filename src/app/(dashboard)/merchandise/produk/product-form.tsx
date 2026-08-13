"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveMerchProduct } from "@/server/actions/merch";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";
import { ImageUploadInput } from "@/components/forms/image-upload";

export function MerchProductForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <Card className="h-fit">
      <CardContent>
        <p className="mb-3 font-medium text-slate-900">Tambah Produk</p>
        <form
          ref={formRef}
          action={(fd) =>
            startTransition(async () => {
              setError(null);
              const result = await saveMerchProduct(fd);
              if (result.error) setError(result.error);
              else {
                formRef.current?.reset();
                router.refresh();
              }
            })
          }
          className="space-y-3"
        >
          <div>
            <Label>Nama</Label>
            <Input name="name" required placeholder="mis. Kaos Consolix" />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Textarea name="description" rows={2} placeholder="Bahan, ukuran, isi paket…" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Harga (Rp)</Label>
              <Input name="price" type="number" min={1000} required />
            </div>
            <div>
              <Label>Stok</Label>
              <Input name="stock" type="number" min={0} defaultValue={0} required />
            </div>
            <div>
              <Label>Urutan</Label>
              <Input name="sortOrder" type="number" min={0} defaultValue={0} />
            </div>
          </div>
          <ImageUploadInput name="imageUrl" folder="merch-products" label="Foto produk" />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4 accent-indigo-600" />
            Aktif (tampil di app)
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton className="w-full">Simpan Produk</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
