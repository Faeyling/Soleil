import { useRegisterSW } from "virtual:pwa-register/react";

export function NotificationMiseAJour() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div
      role="status"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-3 bg-[var(--color-texte)] text-[var(--color-fond)] px-4 py-2.5 text-sm"
    >
      <span>Nouvelle version de Soleil disponible.</span>
      <button
        type="button"
        onClick={() => void updateServiceWorker(true)}
        className="font-bold underline cursor-pointer"
      >
        Recharger
      </button>
    </div>
  );
}
