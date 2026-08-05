// Helpers for reading FormData in Server Actions.

export function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v : "";
}

export function strOrUndef(fd: FormData, key: string): string | undefined {
  const v = str(fd, key).trim();
  return v.length ? v : undefined;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "true" || v === "on" || v === "1";
}

export function list(fd: FormData, key: string): string[] {
  return fd
    .getAll(key)
    .map((v) => String(v).trim())
    .filter(Boolean);
}
