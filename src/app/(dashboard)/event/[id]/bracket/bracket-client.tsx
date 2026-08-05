"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateBracket, resetBracket, setMatchResult } from "@/server/actions/loyalty";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { SubmitButton } from "@/components/forms/form-controls";
import { cn } from "@/lib/utils";

export interface Registration {
  id: string;
  displayName: string;
  status: string;
  placement: number | null;
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  participantAId: string | null;
  participantBId: string | null;
  winnerRegistrationId: string | null;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
}

export function BracketClient({
  eventId,
  matches,
  registrations,
}: {
  eventId: string;
  matches: Match[];
  registrations: Registration[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nameOf = (regId: string | null) =>
    regId ? (registrations.find((r) => r.id === regId)?.displayName ?? "?") : "—";

  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => a - b);

  const run = (action: (fd: FormData) => Promise<{ error?: string }>) => (fd: FormData) =>
    startTransition(async () => {
      setError(null);
      const result = await action(fd);
      if (result.error) setError(result.error);
      else {
        setSelected(null);
        router.refresh();
      }
    });

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <form action={run(generateBracket)}>
          <input type="hidden" name="id" value={eventId} />
          <Button type="submit" size="sm" disabled={pending}>
            Generate Bracket
          </Button>
        </form>
        <form action={run(resetBracket)}>
          <input type="hidden" name="id" value={eventId} />
          <Button type="submit" variant="outline" size="sm" disabled={pending}>
            Reset (admin)
          </Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {matches.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-400">
          Bracket belum dibuat — check-in peserta lalu klik Generate.
        </p>
      ) : (
        // CSS grid per round — no library.
        <div className="overflow-x-auto">
          <div className="flex gap-6">
            {rounds.map((round) => (
              <div key={round} className="min-w-52">
                <p className="mb-2 text-center text-xs font-semibold uppercase text-slate-400">
                  {round === rounds.length ? "Final" : `Ronde ${round}`}
                </p>
                <div className="flex h-full flex-col justify-around gap-4">
                  {matches
                    .filter((m) => m.round === round)
                    .map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setSelected(m)}
                        disabled={m.status !== "ready" && m.status !== "ongoing"}
                        className={cn(
                          "rounded-lg border bg-white p-2 text-left text-sm shadow-sm",
                          m.status === "finished" || m.status === "walkover"
                            ? "border-slate-200 opacity-80"
                            : m.status === "ready"
                              ? "border-indigo-400 hover:bg-indigo-50"
                              : "border-dashed border-slate-300"
                        )}
                      >
                        {(["A", "B"] as const).map((slot) => {
                          const regId = slot === "A" ? m.participantAId : m.participantBId;
                          const won = m.winnerRegistrationId === regId && regId !== null;
                          return (
                            <div
                              key={slot}
                              className={cn(
                                "flex items-center justify-between px-1 py-0.5",
                                won && "font-semibold text-emerald-700"
                              )}
                            >
                              <span>{nameOf(regId)}</span>
                              <span className="text-xs text-slate-400">
                                {slot === "A" ? (m.scoreA ?? "") : (m.scoreB ?? "")}
                                {won && " ✓"}
                              </span>
                            </div>
                          );
                        })}
                        {m.status === "walkover" && (
                          <p className="px-1 text-xs text-slate-400">bye / walkover</p>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Input Hasil Match">
        {selected && (
          <form action={run(setMatchResult)} className="space-y-3">
            <input type="hidden" name="eventId" value={eventId} />
            <input type="hidden" name="matchId" value={selected.id} />
            <div>
              <Label>Pemenang</Label>
              <Select name="winnerRegistrationId" required>
                {[selected.participantAId, selected.participantBId]
                  .filter(Boolean)
                  .map((regId) => (
                    <option key={regId} value={regId!}>
                      {nameOf(regId)}
                    </option>
                  ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Skor {nameOf(selected.participantAId)}</Label>
                <Input name="scoreA" type="number" min={0} />
              </div>
              <div>
                <Label>Skor {nameOf(selected.participantBId)}</Label>
                <Input name="scoreB" type="number" min={0} />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <SubmitButton className="w-full">Simpan Hasil</SubmitButton>
          </form>
        )}
      </Modal>
    </div>
  );
}
