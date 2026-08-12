import { apiGet } from "@/lib/api-client";
import type { Game } from "@/lib/types";
import { deleteGame, saveGame } from "@/server/actions/consoles";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { ArrayInput } from "@/components/forms/array-input";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default async function GamePage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const games = await apiGet<Game[]>("/admin/games");
  const editing = edit ? games.find((g) => g._id === edit) : undefined;

  return (
    <div>
      <PageHeader title="Katalog Game" description="Katalog game (MongoDB) yang bisa dipasang ke unit." />
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Table>
          <THead>
            <TR>
              <TH>Judul</TH>
              <TH>Platform</TH>
              <TH>Genre</TH>
              <TH>Pemain</TH>
              <TH>Populer</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {games.length === 0 && <EmptyRow colSpan={6} />}
            {games.map((g) => (
              <TR key={g._id}>
                <TD data-label="Judul" className="font-medium">{g.title}</TD>
                <TD data-label="Platform">{g.platform.join(", ")}</TD>
                <TD data-label="Genre">{g.genre.join(", ") || "—"}</TD>
                <TD data-label="Pemain">
                  {g.minPlayers}–{g.maxPlayers}
                </TD>
                <TD data-label="Populer">{g.isPopular && <Badge tone="yellow">Populer</Badge>}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/konsol/game?edit=${g._id}`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Ubah
                    </Link>
                    <ConfirmDelete action={deleteGame} id={g._id} label={`Hapus ${g.title}?`} />
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-3 font-medium text-slate-900">{editing ? `Ubah ${editing.title}` : "Tambah Game"}</p>
            <form action={saveGame} className="space-y-3">
              {editing && <input type="hidden" name="id" value={editing._id} />}
              <div>
                <Label>Judul</Label>
                <Input name="title" required defaultValue={editing?.title} />
              </div>
              <div>
                <Label>Platform</Label>
                <ArrayInput name="platform" defaultValue={editing?.platform ?? ["PS5"]} placeholder="PS4, PS5…" />
              </div>
              <div>
                <Label>Genre</Label>
                <ArrayInput name="genre" defaultValue={editing?.genre ?? []} placeholder="Sports, Fighting…" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Min pemain</Label>
                  <Input name="minPlayers" type="number" min={1} defaultValue={editing?.minPlayers ?? 1} />
                </div>
                <div>
                  <Label>Max pemain</Label>
                  <Input name="maxPlayers" type="number" min={1} defaultValue={editing?.maxPlayers ?? 1} />
                </div>
              </div>
              <div>
                <Label>Deskripsi</Label>
                <Textarea name="description" defaultValue={editing?.description ?? ""} />
              </div>
              <SubmitButton className="w-full">{editing ? "Simpan" : "Tambah"}</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
