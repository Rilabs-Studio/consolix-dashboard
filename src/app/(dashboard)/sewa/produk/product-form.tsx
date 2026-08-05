"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRentalProduct } from "@/server/actions/rentals";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";
import { ImageUploadInput } from "@/components/forms/image-upload";

export function RentalProductForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <Card className="h-fit">
      <CardContent className="pt-5">
        <p className="mb-3 font-medium text-slate-900">Tambah Produk Sewa</p>
        <form
          ref={formRef}
          action={(fd) =>
            startTransition(async () => {
              setError(null);
              const result = await saveRentalProduct(fd);
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
            <Input name="name" required placeholder='mis. Bundling PS5 + TV 43"' />
          </div>
          <div>
            <Label>Deskripsi</Label>
            <Textarea name="description" rows={2} placeholder="Isi paket, kelengkapan…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Jenis</Label>
              <Select name="kind" defaultValue="main">
                <option value="main">Utama (basis order)</option>
                <option value="addon">Add-on</option>
              </Select>
            </div>
            <div>
              <Label>Kategori</Label>
              <Select name="category" defaultValue="console">
                <option value="console">Konsol</option>
                <option value="bundle">Bundling PS+TV</option>
                <option value="tv">TV</option>
                <option value="controller">Stik</option>
              </Select>
            </div>
            <div>
              <Label>Harga / hari (Rp)</Label>
              <Input name="pricePerDay" type="number" min={1000} required />
            </div>
            <div>
              <Label>Deposit (Rp)</Label>
              <Input name="depositAmount" type="number" min={0} defaultValue={0} />
            </div>
            <div>
              <Label>Stok</Label>
              <Input name="stock" type="number" min={0} defaultValue={1} required />
            </div>
            <div>
              <Label>Urutan</Label>
              <Input name="sortOrder" type="number" min={0} defaultValue={0} />
            </div>
          </div>
          <ImageUploadInput name="imageUrl" folder="console-units" label="Foto produk (opsional)" />
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
