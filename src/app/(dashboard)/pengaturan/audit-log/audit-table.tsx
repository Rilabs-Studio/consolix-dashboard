"use client";

import { useState } from "react";
import type { AuditLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const ACTION_TONE: Record<string, "green" | "blue" | "yellow" | "red" | "default"> = {
  create: "green",
  approve: "green",
  update: "blue",
  close_shift: "blue",
  reopen_shift: "yellow",
  reject: "red",
  delete: "red",
};

/** Union of keys across both sides so removed fields still show in the diff. */
function diffKeys(before: Record<string, unknown> | null, after: Record<string, unknown> | null) {
  return Array.from(new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]));
}

function cell(value: unknown): string {
  if (value === undefined) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
}

export function AuditTable({ logs }: { logs: AuditLog[] }) {
  const [selected, setSelected] = useState<AuditLog | null>(null);

  return (
    <>
      <Table>
        <THead>
          <TR>
            <TH>Waktu</TH>
            <TH>Admin</TH>
            <TH>Aksi</TH>
            <TH>Entity</TH>
            <TH>Ref</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {logs.length === 0 && <EmptyRow colSpan={6} />}
          {logs.map((log) => (
            <TR key={log.id}>
              <TD data-label="Waktu" className="whitespace-nowrap">{formatDateTime(log.createdAt)}</TD>
              <TD data-label="Admin">{log.adminEmail || "sistem"}</TD>
              <TD data-label="Aksi">
                <Badge tone={ACTION_TONE[log.action] ?? "default"}>{log.action}</Badge>
              </TD>
              <TD data-label="Entity">{log.entity}</TD>
              <TD data-label="Ref" className="max-w-[10rem] truncate font-mono text-xs">{log.entityId ?? "—"}</TD>
              <TD>
                {(log.before || log.after) && (
                  <Button variant="ghost" size="sm" onClick={() => setSelected(log)}>
                    Detail
                  </Button>
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.action} · ${selected.entity}` : ""}
      >
        {selected && (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-1 pr-2">Field</th>
                  <th className="py-1 pr-2">Sebelum</th>
                  <th className="py-1">Sesudah</th>
                </tr>
              </thead>
              <tbody>
                {diffKeys(selected.before, selected.after).map((key) => {
                  const before = selected.before?.[key];
                  const after = selected.after?.[key];
                  const changed = JSON.stringify(before) !== JSON.stringify(after);
                  return (
                    <tr key={key} className="border-b border-slate-100 align-top">
                      <td className="py-1 pr-2 font-mono text-xs">{key}</td>
                      <td className={`py-1 pr-2 ${changed ? "text-red-600" : "text-slate-500"}`}>
                        {cell(before)}
                      </td>
                      <td className={`py-1 ${changed ? "font-medium text-emerald-700" : "text-slate-500"}`}>
                        {cell(after)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
