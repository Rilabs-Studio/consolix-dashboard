import Link from "next/link";
import { apiGet } from "@/lib/api-client";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import { saveEvent, publishEvent } from "@/server/actions/loyalty";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";
import { Button, buttonVariants } from "@/components/ui/button";

interface EventRow {
  id: string;
  title: string;
  type: string;
  status: string;
  startAt: string;
  registrationDeadline: string;
  quota: number | null;
  registeredCount: number;
  entryFeeAmount: number;
  prizePool: string | null;
}

const STATUS_TONE: Record<string, "default" | "green" | "blue" | "yellow" | "red"> = {
  draft: "default",
  published: "green",
  ongoing: "blue",
  finished: "default",
  cancelled: "red",
};

export default async function EventPage() {
  const events = await apiGet<EventRow[]>("/admin/events");

  return (
    <div>
      <PageHeader title="Event & Turnamen" description="Turnamen bracket single-elimination + event komunitas." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Event</TH>
              <TH>Mulai</TH>
              <TH>Peserta</TH>
              <TH>Biaya</TH>
              <TH>Status</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {events.length === 0 && <EmptyRow colSpan={6} />}
            {events.map((e) => (
              <TR key={e.id}>
                <TD data-label="Event">
                  <Link href={`/event/${e.id}/bracket`} className="font-medium text-indigo-700 hover:underline">
                    {e.title}
                  </Link>
                  {e.prizePool && <p className="text-xs text-slate-400">🏆 {e.prizePool}</p>}
                </TD>
                <TD data-label="Mulai" className="text-sm">{formatDateTime(e.startAt)}</TD>
                <TD data-label="Peserta">
                  {e.registeredCount}/{e.quota ?? "∞"}
                </TD>
                <TD data-label="Biaya">{e.entryFeeAmount ? formatRupiah(e.entryFeeAmount) : "Gratis"}</TD>
                <TD data-label="Status">
                  <Badge tone={STATUS_TONE[e.status]}>{e.status}</Badge>
                </TD>
                <TD>
                  <div className="flex items-center gap-1">
                    {e.status === "draft" && (
                      <form action={publishEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <Button type="submit" size="sm">
                          Publikasikan
                        </Button>
                      </form>
                    )}
                    <Link
                      href={`/event/${e.id}/bracket`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Bracket
                    </Link>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent>
            <p className="mb-3 font-medium text-slate-900">Buat Event</p>
            <form action={saveEvent} className="space-y-3">
              <div>
                <Label>Judul</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea name="description" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Jenis</Label>
                  <Select name="type" defaultValue="tournament">
                    <option value="tournament">Turnamen</option>
                    <option value="community">Komunitas</option>
                    <option value="promo_event">Event Promo</option>
                  </Select>
                </div>
                <div>
                  <Label>Kuota</Label>
                  <Input name="quota" type="number" min={2} placeholder="∞" />
                </div>
                <div>
                  <Label>Mulai</Label>
                  <Input name="startAt" type="datetime-local" required />
                </div>
                <div>
                  <Label>Selesai</Label>
                  <Input name="endAt" type="datetime-local" required />
                </div>
                <div className="col-span-2">
                  <Label>Batas pendaftaran</Label>
                  <Input name="registrationDeadline" type="datetime-local" required />
                </div>
                <div>
                  <Label>Biaya (Rp)</Label>
                  <Input name="entryFeeAmount" type="number" min={0} defaultValue={0} />
                </div>
                <div>
                  <Label>Biaya (poin)</Label>
                  <Input name="entryFeePoints" type="number" min={0} defaultValue={0} />
                </div>
              </div>
              <div>
                <Label>Hadiah (deskripsi)</Label>
                <Input name="prizePool" placeholder="Uang tunai 500rb + voucher" />
              </div>
              <div>
                <Label>Reward poin per juara (JSON)</Label>
                <Input name="rewardPoints" placeholder='{"1":500,"2":250}' />
              </div>
              <SubmitButton className="w-full">Simpan (draft)</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
