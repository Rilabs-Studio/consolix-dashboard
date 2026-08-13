import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // data-slot dibaca CardContent untuk mematikan padding atasnya.
      data-slot="card-header"
      className={cn("flex flex-col gap-1 p-4 pb-3 sm:p-5 sm:pb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-slate-900", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // Padding atas hanya dimatikan bila konten tepat di bawah CardHeader —
      // jangan kembali ke kelas dasar `pt-0 sm:pt-0`: `sm:pt-0` tidak bisa
      // ditimpa `pt-5` dari pemanggil (tailwind-merge menganggapnya grup varian
      // berbeda), sehingga kartu tanpa header jadi mepet ke atas di ≥sm.
      className={cn("p-4 sm:p-5 [[data-slot=card-header]+&]:pt-0", className)}
      {...props}
    />
  );
}
