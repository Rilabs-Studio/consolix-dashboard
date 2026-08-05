"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveTopup, rejectTopupWithReason } from "@/server/actions/topup";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

export function TopupRowActions({ id }: { id: string }) {
  const router = useRouter();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <form
        action={(fd) =>
          startTransition(async () => {
            await approveTopup(fd);
            router.refresh();
          })
        }
      >
        <input type="hidden" name="id" value={id} />
        <Button type="submit" size="sm" disabled={pending}>
          Setujui
        </Button>
      </form>
      <Button variant="ghost" size="sm" onClick={() => setRejectOpen(true)}>
        Tolak
      </Button>
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Tolak Topup">
        <form
          action={(fd) =>
            startTransition(async () => {
              const result = await rejectTopupWithReason(fd);
              if (result.error) setError(result.error);
              else {
                setRejectOpen(false);
                router.refresh();
              }
            })
          }
          className="space-y-3"
        >
          <input type="hidden" name="id" value={id} />
          <div>
            <Label>Alasan penolakan</Label>
            <Input name="reason" required placeholder="mis. nominal tidak cocok" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton className="w-full">Tolak Topup</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
