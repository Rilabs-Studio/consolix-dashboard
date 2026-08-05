"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createExpense, saveExpenseCategory } from "@/server/actions/ops";
import type { ExpenseCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

export function ExpenseForm({ categories }: { categories: ExpenseCategory[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium text-slate-900">Catat Pengeluaran</p>
        <Button variant="ghost" size="sm" onClick={() => setCategoryOpen(true)}>
          + Kategori
        </Button>
      </div>
      <form
        ref={formRef}
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            const result = await createExpense(fd);
            if (result.error) setError(result.error);
            else {
              formRef.current?.reset();
              router.refresh();
            }
          })
        }
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6"
      >
        <div>
          <Label>Tanggal</Label>
          <Input type="date" name="date" defaultValue={today} required />
        </div>
        <div>
          <Label>Kategori</Label>
          <Select name="expenseCategoryId" required defaultValue="">
            <option value="" disabled>
              Pilih…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Label>Deskripsi</Label>
          <Input name="description" required placeholder="mis. Token listrik" />
        </div>
        <div>
          <Label>Jumlah (Rp)</Label>
          <Input type="number" name="amount" min={100} required placeholder="50000" />
        </div>
        <div>
          <Label>Metode</Label>
          <Select name="paymentMethod" defaultValue="cash">
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer</option>
          </Select>
        </div>
        {error && <p className="text-sm text-red-600 sm:col-span-2 lg:col-span-6">{error}</p>}
        <div className="lg:col-span-6">
          <SubmitButton>Simpan Pengeluaran</SubmitButton>
        </div>
      </form>

      <Modal open={categoryOpen} onClose={() => setCategoryOpen(false)} title="Kategori Baru">
        <form
          action={(fd) =>
            startTransition(async () => {
              setCategoryError(null);
              const result = await saveExpenseCategory(fd);
              if (result.error) setCategoryError(result.error);
              else {
                setCategoryOpen(false);
                router.refresh();
              }
            })
          }
          className="space-y-3"
        >
          <div>
            <Label>Nama</Label>
            <Input name="name" required placeholder="mis. Perawatan" />
          </div>
          <div>
            <Label>Kode</Label>
            <Input name="code" required placeholder="mis. MAINT" />
          </div>
          {categoryError && <p className="text-sm text-red-600">{categoryError}</p>}
          <SubmitButton className="w-full">Simpan Kategori</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
