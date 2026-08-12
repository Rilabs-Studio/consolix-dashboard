import { apiGet } from "@/lib/api-client";
import { checkInParticipant } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { BracketClient, type Match, type Registration } from "./bracket-client";

interface EventDetail {
  id: string;
  title: string;
  status: string;
  registrations: Registration[];
  bracket: Match[];
}

export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await apiGet<EventDetail>(`/admin/events/${id}`);

  return (
    <div>
      <PageHeader
        title={`Bracket — ${event.title}`}
        description="Klik match untuk input skor & pemenang. Bye otomatis walkover."
      />
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Peserta ({event.registrations.length})
          </p>
          <Table>
            <THead>
              <TR>
                <TH>Nama</TH>
                <TH>Status</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {event.registrations.length === 0 && <EmptyRow colSpan={3} label="Belum ada peserta" />}
              {event.registrations.map((r) => (
                <TR key={r.id}>
                  <TD data-label="Nama" className="font-medium">
                    {r.displayName}
                    {r.placement && <Badge tone="yellow" className="ml-2">Juara {r.placement}</Badge>}
                  </TD>
                  <TD data-label="Status">
                    <Badge tone={r.status === "checked_in" ? "green" : "default"}>{r.status}</Badge>
                  </TD>
                  <TD>
                    {r.status === "registered" && (
                      <form action={checkInParticipant}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <input type="hidden" name="regId" value={r.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Check-in
                        </Button>
                      </form>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
        <BracketClient
          eventId={event.id}
          matches={event.bracket}
          registrations={event.registrations}
        />
      </div>
    </div>
  );
}
