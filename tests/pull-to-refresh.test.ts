import { describe, it, expect } from "vitest";
import {
  MAX_PULL,
  TRIGGER_PULL,
  dampPull,
  isVerticalPull,
  pullProgress,
  shouldTrigger,
} from "@/lib/pull-to-refresh";

describe("pull-to-refresh — dampPull", () => {
  it("meredam gerakan jari, bukan memetakannya 1:1", () => {
    expect(dampPull(100)).toBeLessThan(100);
    expect(dampPull(100)).toBe(50);
  });

  it("dibatasi MAX_PULL berapa pun panjang tarikannya", () => {
    expect(dampPull(10_000)).toBe(MAX_PULL);
  });

  it("gerakan ke atas tidak menghasilkan tarikan", () => {
    expect(dampPull(-120)).toBe(0);
    expect(dampPull(0)).toBe(0);
  });

  it("ambang bisa dicapai dengan tarikan jari yang wajar", () => {
    // Ambang harus terjangkau di layar 667px — kalau tidak, gesturnya mustahil.
    expect(shouldTrigger(dampPull(140))).toBe(true);
  });
});

describe("pull-to-refresh — shouldTrigger", () => {
  it("memicu tepat di ambang", () => {
    expect(shouldTrigger(TRIGGER_PULL)).toBe(true);
    expect(shouldTrigger(TRIGGER_PULL - 1)).toBe(false);
  });
});

describe("pull-to-refresh — isVerticalPull", () => {
  it("menerima tarikan ke bawah yang dominan vertikal", () => {
    expect(isVerticalPull(4, 40)).toBe(true);
  });

  it("menolak geseran mendatar (tabel scroll & strip tab)", () => {
    expect(isVerticalPull(60, 10)).toBe(false);
  });

  it("menolak gerakan ke atas — itu scroll biasa", () => {
    expect(isVerticalPull(0, -40)).toBe(false);
  });

  it("menolak gerakan diagonal yang ambigu", () => {
    expect(isVerticalPull(30, 30)).toBe(false);
  });
});

describe("pull-to-refresh — pullProgress", () => {
  it("berjalan 0→1 lalu berhenti di 1", () => {
    expect(pullProgress(0)).toBe(0);
    expect(pullProgress(TRIGGER_PULL / 2)).toBeCloseTo(0.5);
    expect(pullProgress(TRIGGER_PULL)).toBe(1);
    expect(pullProgress(MAX_PULL)).toBe(1);
  });
});
