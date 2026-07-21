import { db } from "../data/db";
import { exporterDonnees } from "../data/repositories/sauvegardeRepository";
import { marquerSauvegardeExportee } from "./rappels";

const CLE_HANDLE = "sauvegarde-auto-handle";

export function supporteFileSystemAccess(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

async function obtenirHandle(): Promise<FileSystemFileHandle | undefined> {
  const ligne = await db.parametres.get(CLE_HANDLE);
  return ligne?.valeur as FileSystemFileHandle | undefined;
}

/** À appeler depuis un geste utilisateur (clic) : ouvre le sélecteur de fichier. */
export async function choisirFichierSauvegardeAuto(): Promise<boolean> {
  if (!supporteFileSystemAccess()) return false;
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "soleil-sauvegarde.json",
      types: [{ description: "Sauvegarde Soleil (JSON)", accept: { "application/json": [".json"] } }],
    });
    await db.parametres.put({ cle: CLE_HANDLE, valeur: handle });
    return true;
  } catch (err) {
    // L'utilisateur a fermé le sélecteur sans choisir de fichier — pas une erreur à remonter.
    if (err instanceof DOMException && err.name === "AbortError") return false;
    throw err;
  }
}

export async function desactiverSauvegardeAuto(): Promise<void> {
  await db.parametres.delete(CLE_HANDLE);
}

export async function nomFichierSauvegardeAuto(): Promise<string | undefined> {
  const handle = await obtenirHandle();
  return handle?.name;
}

export type EtatPermissionSauvegardeAuto = "non-configuree" | "accordee" | "a-demander" | "refusee";

export async function etatPermissionSauvegardeAuto(): Promise<EtatPermissionSauvegardeAuto> {
  const handle = await obtenirHandle();
  if (!handle) return "non-configuree";
  const etat = await handle.queryPermission({ mode: "readwrite" });
  if (etat === "granted") return "accordee";
  if (etat === "denied") return "refusee";
  return "a-demander";
}

async function ecrireSauvegarde(handle: FileSystemFileHandle): Promise<void> {
  const sauvegarde = await exporterDonnees();
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(sauvegarde, null, 2));
  await writable.close();
  marquerSauvegardeExportee();
}

/** À appeler depuis un geste utilisateur : demande la permission si besoin, puis écrit. */
export async function autoriserEtEcrireSauvegardeAuto(): Promise<boolean> {
  const handle = await obtenirHandle();
  if (!handle) return false;
  const etat = await handle.requestPermission({ mode: "readwrite" });
  if (etat !== "granted") return false;
  await ecrireSauvegarde(handle);
  return true;
}

/**
 * Écrit silencieusement la sauvegarde si un fichier est configuré et que la
 * permission est déjà accordée, sans jamais la redemander — un
 * `requestPermission` hors geste utilisateur échoue ou affiche un prompt
 * intempestif. Renvoie `true` si l'écriture a eu lieu.
 */
export async function synchroniserSauvegardeAutoSiPossible(): Promise<boolean> {
  if (!supporteFileSystemAccess()) return false;
  const handle = await obtenirHandle();
  if (!handle) return false;
  const etat = await handle.queryPermission({ mode: "readwrite" });
  if (etat !== "granted") return false;
  await ecrireSauvegarde(handle);
  return true;
}
