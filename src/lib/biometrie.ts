const CLE_IDENTIFIANT_CREDENTIAL = "soleil-empreinte-credential-id";

function versBase64(tampon: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(tampon)));
}

function depuisBase64(chaine: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(chaine), (c) => c.charCodeAt(0));
}

function octetsAleatoires(taille: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(new ArrayBuffer(taille)));
}

/** L'appareil propose-t-il un capteur biométrique (empreinte, visage...) utilisable via WebAuthn ? */
export async function biometrieDisponible(): Promise<boolean> {
  if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Le déverrouillage par empreinte a-t-il déjà été activé sur cet appareil ? */
export function biometrieActivee(): boolean {
  return localStorage.getItem(CLE_IDENTIFIANT_CREDENTIAL) !== null;
}

/**
 * Enregistre une empreinte (ou tout authentificateur biométrique de la
 * plateforme) auprès du navigateur. Tout reste local : aucun serveur, aucune
 * donnée biométrique n'est jamais accessible à Soleil — seul le navigateur
 * et le système d'exploitation communiquent avec le capteur.
 */
export async function activerBiometrie(): Promise<void> {
  const identifiants = (await navigator.credentials.create({
    publicKey: {
      challenge: octetsAleatoires(32),
      rp: { name: "Soleil" },
      user: { id: octetsAleatoires(16), name: "soleil-local", displayName: "Soleil" },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
      timeout: 60000,
    },
  })) as PublicKeyCredential | null;

  if (!identifiants) throw new Error("Aucune empreinte enregistrée.");
  localStorage.setItem(CLE_IDENTIFIANT_CREDENTIAL, versBase64(identifiants.rawId));
}

/** Retire l'empreinte enregistrée — ne supprime pas le code à 4 chiffres, qui reste le verrou principal. */
export function desactiverBiometrie(): void {
  localStorage.removeItem(CLE_IDENTIFIANT_CREDENTIAL);
}

/**
 * Demande une vérification par empreinte. Retourne `true` uniquement si le
 * capteur confirme l'identité de la personne (le navigateur rejette toute
 * tentative annulée ou échouée) — sans jamais transmettre de donnée
 * biométrique à Soleil.
 */
export async function verifierBiometrie(): Promise<boolean> {
  const idStocke = localStorage.getItem(CLE_IDENTIFIANT_CREDENTIAL);
  if (!idStocke) return false;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: octetsAleatoires(32),
        allowCredentials: [{ id: depuisBase64(idStocke), type: "public-key" }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return assertion !== null;
  } catch {
    return false;
  }
}
