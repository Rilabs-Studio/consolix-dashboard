"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cashTopup } from "@/server/actions/topup";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";
import { UserPicker } from "@/components/forms/user-picker";

export function CashTopupForm() {
  const [error, setError] = useState<string | null>(null);
  const [pickerKey, setPickerKey] = useState(0); // bump resets the picker after success
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  return (
    <form
      ref={formRef}
      action={(fd) =>
        startTransition(async () => {
          const result = await cashTopup(fd);
          if (result.error) {
            setError(result.error);
            return;
          }
          setError(null);
          formRef.current?.reset();
          setPickerKey((k) => k + 1);
          router.refresh();
        })
      }
      className="space-y-3"
    >
      <UserPicker key={pickerKey} />
      <div>
        <Label>Nominal (Rp)</Label>
        <Input name="amount" type="number" min={10000} step={1000} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <SubmitButton className="w-full">Terima Tunai</SubmitButton>
    </form>
  );
}
