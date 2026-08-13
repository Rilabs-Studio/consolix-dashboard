"use client";

import { createAdmin } from "@/server/actions/admins";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";
import { ADMIN_ROLES, ADMIN_ROLE_LABEL } from "@/lib/constants";

export function AdminForm() {
  return (
    <Card>
      <CardContent>
        <p className="mb-3 font-medium text-slate-900">Tambah Akun</p>
        <form action={createAdmin} className="space-y-3">
          <div>
            <Label>Nama</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Email</Label>
            <Input name="email" type="email" required />
          </div>
          <div>
            <Label>Password (min 8)</Label>
            <Input name="password" type="password" minLength={8} required />
          </div>
          <div>
            <Label>Role</Label>
            <Select name="role" defaultValue="CASHIER">
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ADMIN_ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </div>
          <SubmitButton className="w-full">Buat Akun</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
