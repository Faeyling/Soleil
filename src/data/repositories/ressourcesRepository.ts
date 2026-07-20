import { v4 as uuid } from "uuid";
import { db } from "../db";
import { maintenantISO } from "../../lib/date";
import type { RessourceNote } from "../types";

export async function listerNotesRessources(): Promise<RessourceNote[]> {
  const notes = await db.ressourcesNotes.orderBy("createdAt").toArray();
  return notes.reverse();
}

export async function ajouterNoteRessource(
  donnees: Omit<RessourceNote, "id" | "createdAt">,
): Promise<RessourceNote> {
  const note: RessourceNote = { ...donnees, id: uuid(), createdAt: maintenantISO() };
  await db.ressourcesNotes.add(note);
  return note;
}

export async function modifierNoteRessource(
  id: string,
  changements: Partial<Omit<RessourceNote, "id" | "createdAt">>,
): Promise<void> {
  await db.ressourcesNotes.update(id, changements);
}

export async function supprimerNoteRessource(id: string): Promise<void> {
  await db.ressourcesNotes.delete(id);
}
