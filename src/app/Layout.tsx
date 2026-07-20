import { NavLink, Outlet } from "react-router-dom";

const ONGLETS = [
  { to: "/", label: "Accueil", icone: "🏠", fin: true },
  { to: "/historique", label: "Historique", icone: "📅" },
  { to: "/ressources", label: "Ressources", icone: "📖" },
  { to: "/profil", label: "Profil", icone: "👤" },
];

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-fond">
      <main className="flex-1 pb-24 max-w-2xl w-full mx-auto px-4 pt-6">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-bordure z-40">
        <div className="max-w-2xl mx-auto flex justify-around">
          {ONGLETS.map((onglet) => (
            <NavLink
              key={onglet.to}
              to={onglet.to}
              end={onglet.fin}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 px-3 flex-1 text-xs font-semibold transition-colors ${
                  isActive ? "text-terracotta" : "text-texte-doux"
                }`
              }
            >
              <span className="text-xl leading-none">{onglet.icone}</span>
              {onglet.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
