"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "./api";
import type { AppSettings } from "./types";

let cached: AppSettings | null = null;
let pending: Promise<AppSettings> | null = null;

/** The shop's name/phone, fetched once per session (used in WhatsApp messages). */
export function useShop(): AppSettings | null {
  const [shop, setShop] = useState<AppSettings | null>(cached);
  useEffect(() => {
    if (cached) return;
    pending ??= apiFetch<AppSettings>("/app-settings/");
    pending
      .then((s) => {
        cached = s;
        setShop(s);
      })
      .catch(() => {
        pending = null;
      });
  }, []);
  return shop;
}

export function invalidateShop() {
  cached = null;
  pending = null;
}
