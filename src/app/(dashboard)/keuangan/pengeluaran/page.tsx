import { apiGet } from "@/lib/api-client";
import type { Expense, ExpenseCategory } from "@/lib/types";
import { formatDate, formatRupiah } from "@/lib/utils";
import { deleteExpense } from "@/server/actions/ops";
import { PageHeader } from "@/components/layout/page-header";
import { Table, THead, TBody, TR, TH, TD, EmptyRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/forms/form-controls";
import { ExpenseForm } from "./expense-form";

export default async function PengeluaranPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
  const [expenses, categories] = await Promise.all([
    apiGet<Expense[]>("/admin/expenses", { from, to }),
    apiGet<ExpenseCategory[]>("/admin/expense-categories"),
  ]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  return (
    <div>
      <PageHeader
        title="Pengeluaran"
        description="Catatan biaya operasional. Pengeluaran cash saat shift terbuka otomatis mengurangi expected cash shift."
      />
      <div className="mb-6">
        <ExpenseForm categories={categories} />
      </div>
      <Table>
        <THead>
          <TR>
            <TH>Tanggal</TH>
            <TH>Kategori</TH>
            <TH>Deskripsi</TH>
            <TH>Metode</TH>
            <TH className="text-right">Jumlah</TH>
            <TH>Shift</TH>
            <TH />
          </TR>
        </THead>
        <TBody>
          {expenses.length === 0 && <EmptyRow colSpan={7} />}
          {expenses.map((e) => (
            <TR key={e.id}>
              <TD>{formatDate(e.date)}</TD>
              <TD>{categoryName(e.expenseCategoryId)}</TD>
              <TD>{e.description}</TD>
              <TD>{e.paymentMethod === "cash" ? "Tunai" : "Transfer"}</TD>
              <TD className="text-right font-medium">{formatRupiah(e.amount)}</TD>
              <TD>
                {e.cashShiftId ? <Badge tone="blue">Ter-stamp shift</Badge> : <Badge>—</Badge>}
              </TD>
              <TD>
                <ConfirmDelete action={deleteExpense} id={e.id} />
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
