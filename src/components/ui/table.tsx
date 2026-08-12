import * as React from "react";
import { cn } from "@/lib/utils";

export type TableLayout = "cards" | "scroll";

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  /**
   * `cards` (default): tiap baris jadi kartu label/nilai di bawah `md`, tabel
   * biasa dari `md` ke atas. `scroll`: selalu scroll horizontal — untuk tabel
   * yang gunanya membandingkan antar baris (mis. rekap keuangan).
   */
  layout?: TableLayout;
  /** Lebar minimum tabel sebelum mulai men-scroll. Panjang CSS apa pun. */
  minWidth?: string;
  /** Bekukan kolom pertama saat scroll horizontal (desktop saja). */
  stickyFirstColumn?: boolean;
  wrapperClassName?: string;
}

export function Table({
  layout = "cards",
  minWidth = "48rem",
  stickyFirstColumn = false,
  className,
  wrapperClassName,
  ...props
}: TableProps) {
  return (
    <div
      // Inline style, bukan class Tailwind: JIT tidak bisa melihat nilai runtime
      // sehingga `min-w-[${minWidth}]` akan terkompilasi jadi kosong diam-diam.
      style={{ ["--table-min-w" as string]: minWidth }}
      className={cn(
        "w-full overflow-x-auto rounded-lg border border-slate-200 bg-white",
        layout === "cards" ? "table-cards-shell" : "table-scroll-shell",
        wrapperClassName
      )}
    >
      <table
        role="table"
        className={cn(
          "w-full text-sm",
          layout === "scroll" && "[&_td]:whitespace-nowrap",
          stickyFirstColumn &&
            "md:[&_tbody_tr>*:first-child]:bg-white md:[&_thead_tr>*:first-child]:bg-slate-50 md:[&_tr>*:first-child]:sticky md:[&_tr>*:first-child]:left-0 md:[&_tr>*:first-child]:z-10",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      role="rowgroup"
      className={cn("bg-slate-50 text-left text-slate-500", className)}
      {...props}
    />
  );
}

export function TBody(props: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody role="rowgroup" className="divide-y divide-slate-100" {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  // `display:block` di mode kartu menghapus semantik tabel implisit, jadi role
  // eksplisit inilah yang menjaga markup tetap terbaca screen reader.
  return <tr role="row" className={cn("hover:bg-slate-50/60", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      role="columnheader"
      className={cn("px-4 py-2.5 font-medium whitespace-nowrap", className)}
      {...props}
    />
  );
}

export interface TDProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Label kolom yang dicetak sebelum nilai di mode kartu — salin dari `<TH>`
   * yang bersesuaian. Kosongkan pada sel aksi; sel itu lalu memakai lebar penuh
   * alih-alih menampilkan label kosong.
   */
  "data-label"?: string;
}

export function TD({ className, ...props }: TDProps) {
  return (
    <td role="cell" className={cn("px-4 py-2.5 align-middle max-md:px-0", className)} {...props} />
  );
}

export function EmptyRow({ colSpan, label = "Belum ada data" }: { colSpan: number; label?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-400">
        {label}
      </td>
    </tr>
  );
}
