import type { CardEntry } from "./types";

export async function loadManifest(url: string): Promise<CardEntry[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Manifest request failed (${res.status})`);
  return (await res.json()) as CardEntry[];
}
