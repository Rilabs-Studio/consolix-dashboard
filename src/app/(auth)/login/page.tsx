import { LoginForm } from "./login-form";

export const metadata = { title: "Masuk — Consolix Admin" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white">
            C
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Consolix Admin</h1>
          <p className="text-sm text-slate-500">Masuk untuk mengelola dashboard</p>
        </div>
        <LoginForm />
        <p className="mt-4 text-center text-xs text-slate-400">
          Demo: admin@consolix.id / admin12345
        </p>
      </div>
    </div>
  );
}
