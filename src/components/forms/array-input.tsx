"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Edits a string[] value. Renders one hidden input per item with the same
 * `name`, so a Server Action reads them via `formData.getAll(name)`.
 */
export function ArrayInput({
  name,
  defaultValue = [],
  placeholder = "Tambah item…",
}: {
  name: string;
  defaultValue?: string[];
  placeholder?: string;
}) {
  const [items, setItems] = useState<string[]>(defaultValue);
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    setItems((prev) => [...prev, v]);
    setDraft("");
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="secondary" size="icon" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
          >
            {item}
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-slate-400 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </button>
            <input type="hidden" name={name} value={item} />
          </span>
        ))}
        {items.length === 0 && <span className="text-xs text-slate-400">Belum ada item</span>}
      </div>
    </div>
  );
}
