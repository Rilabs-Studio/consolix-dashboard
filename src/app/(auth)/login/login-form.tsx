"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/actions/auth-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/forms/form-controls";

export function LoginForm() {
  const [error, formAction] = useActionState(loginAction, undefined);

  return (
    <Card>
      <CardContent className="pt-5">
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required defaultValue="admin@consolix.id" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <SubmitButton className="w-full">Masuk</SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
