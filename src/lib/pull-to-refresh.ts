/**
 * Perhitungan murni untuk gestur tarik-untuk-menyegarkan di `RefreshableMain`.
 * Dipisah dari komponennya supaya bisa diuji tanpa DOM (vitest jalan di
 * environment `node`, tanpa jsdom).
 */

/** Jarak tarik (setelah diredam) yang memicu refresh. */
export const TRIGGER_PULL = 64;

/** Batas atas indikator supaya tarikan panjang tidak menyeret terlalu jauh. */
export const MAX_PULL = 96;

/** Rasio redaman: jari bergerak 2px, indikator turun 1px. */
const RESISTANCE = 0.5;

/**
 * Ubah jarak jari jadi jarak indikator. Diredam supaya terasa "berat" seperti
 * pull-to-refresh native, dan dibatasi `MAX_PULL`.
 */
export function dampPull(deltaY: number): number {
  if (deltaY <= 0) return 0;
  return Math.min(deltaY * RESISTANCE, MAX_PULL);
}

/** Sudah cukup jauh untuk menyegarkan saat jari dilepas? */
export function shouldTrigger(pull: number): boolean {
  return pull >= TRIGGER_PULL;
}

/**
 * Gestur ini milik kami atau bukan. Hanya tarikan ke bawah yang dominan
 * vertikal — geseran mendatar diserahkan ke elemen lain (mis. tabel
 * `layout="scroll"` dan strip tab yang menggeser).
 */
export function isVerticalPull(deltaX: number, deltaY: number): boolean {
  return deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX);
}

/** Opasitas indikator: memudar masuk seiring tarikan mendekati ambang. */
export function pullProgress(pull: number): number {
  return Math.min(pull / TRIGGER_PULL, 1);
}
