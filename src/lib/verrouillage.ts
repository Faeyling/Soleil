const CLE_HASH_CODE = "soleil-code-hash";
const CLE_SESSION_DEVERROUILLEE = "soleil-session-deverrouillee";

async function hasherCode(code: string): Promise<string> {
  const donnees = new TextEncoder().encode(code);
  const empreinte = await crypto.subtle.digest("SHA-256", donnees);
  return Array.from(new Uint8Array(empreinte))
    .map((octet) => octet.toString(16).padStart(2, "0"))
    .join("");
}

/** Un code de verrouillage a-t-il été activé sur cet appareil ? */
export function codeEstDefini(): boolean {
  return localStorage.getItem(CLE_HASH_CODE) !== null;
}

export async function definirCode(code: string): Promise<void> {
  localStorage.setItem(CLE_HASH_CODE, await hasherCode(code));
}

export async function verifierCode(code: string): Promise<boolean> {
  const hashEnregistre = localStorage.getItem(CLE_HASH_CODE);
  if (!hashEnregistre) return true;
  return (await hasherCode(code)) === hashEnregistre;
}

export function supprimerCode(): void {
  localStorage.removeItem(CLE_HASH_CODE);
  sessionStorage.removeItem(CLE_SESSION_DEVERROUILLEE);
}

/** L'app est déverrouillée si aucun code n'est défini, ou si la session en cours a déjà été déverrouillée. */
export function estDeverrouille(): boolean {
  return !codeEstDefini() || sessionStorage.getItem(CLE_SESSION_DEVERROUILLEE) === "1";
}

export function marquerSessionDeverrouillee(): void {
  sessionStorage.setItem(CLE_SESSION_DEVERROUILLEE, "1");
}

/** Reverrouille immédiatement, sans attendre la fin de la session (nouvel onglet/relance). */
export function verrouillerMaintenant(): void {
  sessionStorage.removeItem(CLE_SESSION_DEVERROUILLEE);
}
