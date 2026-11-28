"use client";
import { Suspense } from "react";
import MarketView from "@/components/MarketView";

/** Bosh sahifa — faqat akkauntlar (qidiruv + filtr + katta kartalar) */
export default function Home() { return <Suspense><MarketView /></Suspense>; }
