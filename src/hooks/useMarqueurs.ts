import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../data/db";
import type { Marqueur } from "../data/types";

export function useMarqueurs(): Marqueur[] {
  return useLiveQuery(() => db.marqueurs.orderBy("date").toArray(), []) ?? [];
}
