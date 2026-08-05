"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replyRating, toggleHideRating } from "@/server/actions/ops";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";

export function RatingRowActions({
  id,
  isHidden,
  hasReply,
}: {
  id: string;
  isHidden: boolean;
  hasReply: boolean;
}) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={() => setReplyOpen(true)}>
        {hasReply ? "Ubah Balasan" : "Balas"}
      </Button>
      <form
        action={(fd) =>
          startTransition(async () => {
            await toggleHideRating(fd);
            router.refresh();
          })
        }
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="isHidden" value={isHidden ? "false" : "true"} />
        <Button type="submit" variant="ghost" size="sm" disabled={pending}>
          {isHidden ? "Tampilkan" : "Sembunyikan"}
        </Button>
      </form>

      <Modal open={replyOpen} onClose={() => setReplyOpen(false)} title="Balas Rating">
        <form
          action={(fd) =>
            startTransition(async () => {
              const result = await replyRating(fd);
              if (result.error) setError(result.error);
              else {
                setReplyOpen(false);
                router.refresh();
              }
            })
          }
          className="space-y-3"
        >
          <input type="hidden" name="id" value={id} />
          <div>
            <Label>Balasan</Label>
            <Textarea name="reply" rows={3} required placeholder="Terima kasih atas penilaiannya!" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton className="w-full">Kirim Balasan</SubmitButton>
        </form>
      </Modal>
    </div>
  );
}
