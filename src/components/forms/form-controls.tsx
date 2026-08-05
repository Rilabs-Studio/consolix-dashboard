"use client";

import { useFormStatus } from "react-dom";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

export function SubmitButton({ children = "Simpan", ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? "Menyimpan…" : children}
    </Button>
  );
}

/** Inline delete button that confirms then calls a Server Action. */
export function ConfirmDelete({
  action,
  id,
  label = "Hapus item ini?",
  fields,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  /** Extra hidden fields submitted alongside `id` (e.g. parent ids). */
  fields?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form
      action={(fd) => {
        if (!confirm(label)) return;
        startTransition(() => action(fd));
      }}
    >
      <input type="hidden" name="id" value={id} />
      {fields &&
        Object.entries(fields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <Button type="submit" variant="ghost" size="icon" disabled={pending} title="Hapus">
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </form>
  );
}
