import { apiGet } from "@/lib/api-client";
import { getTvDevices } from "@/lib/rdms";
import type { ConsoleType, ConsoleUnit, Game, UnitGame } from "@/lib/types";
import { assignUnitGame, unassignUnitGame, updateConsoleUnit } from "@/server/actions/consoles";
import { DeleteUnitButton } from "./delete-unit-button";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { SubmitButton, ConfirmDelete } from "@/components/forms/form-controls";
import { UnitForm } from "../unit-form";

export default async function KonsolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [types, units, games, devices] = await Promise.all([
    apiGet<ConsoleType[]>("/admin/console-types"),
    apiGet<ConsoleUnit[]>("/admin/console-units"),
    apiGet<Game[]>("/admin/games"),
    getTvDevices(),
  ]);
  const unit = units.find((u) => u.id === id);
  if (!unit) return <p className="text-slate-500">Unit tidak ditemukan.</p>;
  const unitGames = await apiGet<UnitGame[]>(`/admin/console-units/${id}/games`);
  const installedIds = new Set(unitGames.map((g) => g.gameId));
  const installable = games.filter((g) => !installedIds.has(g._id));

  return (
    <div>
      <PageHeader title={`Unit ${unit.code}`} description="Ubah data unit & kelola game terpasang." />
      <div className="grid gap-6 lg:grid-cols-2">
        <UnitForm action={updateConsoleUnit} types={types} devices={devices} unit={unit} />
        <Card>
          <CardContent>
            <p className="mb-3 font-medium text-slate-900">Game Terpasang ({unitGames.length})</p>
            <ul className="mb-4 divide-y divide-slate-100">
              {unitGames.length === 0 && <li className="py-2 text-sm text-slate-400">Belum ada game.</li>}
              {unitGames.map((g) => (
                <li key={g.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{g.gameTitle}</span>
                  <ConfirmDelete
                    action={unassignUnitGame}
                    id={g.gameId}
                    label={`Copot ${g.gameTitle}?`}
                    fields={{ unitId: unit.id }}
                  />
                </li>
              ))}
            </ul>
            {installable.length > 0 && (
              <form action={assignUnitGame} className="flex gap-2">
                <input type="hidden" name="unitId" value={unit.id} />
                <Select name="gameId" className="flex-1">
                  {installable.map((g) => (
                    <option key={g._id} value={g._id}>
                      {g.title}
                    </option>
                  ))}
                </Select>
                <SubmitButton>Pasang</SubmitButton>
              </form>
            )}
            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="mb-2 text-sm text-slate-500">Hapus unit (hanya admin):</p>
              <DeleteUnitButton id={unit.id} code={unit.code} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
