"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DEPOSIT_CARD, DEPOSIT_CARD_OWNER } from "@/lib/uzdrop";

export interface DepositSettings { enabled: boolean; card: string; owner: string; message: string; }

/** To'lov kartasi va holati — admin paneldan boshqariladi (bazada), bo'lmasa env qiymatlari */
export function useDepositSettings() {
  const [s, setS] = useState<DepositSettings | null>(null);
  const load = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "deposit").maybeSingle();
    const v = (data?.value ?? {}) as Partial<DepositSettings>;
    setS({
      enabled: v.enabled ?? true,
      card: v.card || DEPOSIT_CARD,
      owner: v.owner || DEPOSIT_CARD_OWNER,
      message: v.message || "",
    });
  };
  useEffect(() => { load(); }, []);
  return { settings: s, reload: load };
}
