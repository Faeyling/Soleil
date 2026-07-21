import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { AccueilPage } from "../features/accueil/AccueilPage";
import { ChargementEcran } from "../components/ui/ChargementEcran";

const SymptomesListePage = lazy(() =>
  import("../features/symptomes/SymptomesListePage").then((m) => ({ default: m.SymptomesListePage })),
);
const SymptomeFormPage = lazy(() =>
  import("../features/symptomes/SymptomeFormPage").then((m) => ({ default: m.SymptomeFormPage })),
);
const MedicamentsPage = lazy(() =>
  import("../features/medicaments/MedicamentsPage").then((m) => ({ default: m.MedicamentsPage })),
);
const MedicamentFormPage = lazy(() =>
  import("../features/medicaments/MedicamentFormPage").then((m) => ({ default: m.MedicamentFormPage })),
);
const SuivisListePage = lazy(() =>
  import("../features/suivis/SuivisListePage").then((m) => ({ default: m.SuivisListePage })),
);
const SuiviFormPage = lazy(() =>
  import("../features/suivis/SuiviFormPage").then((m) => ({ default: m.SuiviFormPage })),
);
const ParcoursQuotidienPage = lazy(() =>
  import("../features/parcours/ParcoursQuotidienPage").then((m) => ({ default: m.ParcoursQuotidienPage })),
);
const HistoriquePage = lazy(() =>
  import("../features/historique/HistoriquePage").then((m) => ({ default: m.HistoriquePage })),
);
const RessourcesPage = lazy(() =>
  import("../features/ressources/RessourcesPage").then((m) => ({ default: m.RessourcesPage })),
);
const ProfilPage = lazy(() =>
  import("../features/profil/ProfilPage").then((m) => ({ default: m.ProfilPage })),
);

function AvecChargement(enfant: ReactNode) {
  return <Suspense fallback={<ChargementEcran />}>{enfant}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <AccueilPage /> },
      { path: "symptomes", element: AvecChargement(<SymptomesListePage />) },
      { path: "symptomes/:id", element: AvecChargement(<SymptomeFormPage />) },
      { path: "medicaments", element: AvecChargement(<MedicamentsPage />) },
      { path: "medicaments/:id", element: AvecChargement(<MedicamentFormPage />) },
      { path: "suivis", element: AvecChargement(<SuivisListePage />) },
      { path: "suivis/:id", element: AvecChargement(<SuiviFormPage />) },
      { path: "parcours", element: AvecChargement(<ParcoursQuotidienPage />) },
      { path: "historique", element: AvecChargement(<HistoriquePage />) },
      { path: "ressources", element: AvecChargement(<RessourcesPage />) },
      { path: "profil", element: AvecChargement(<ProfilPage />) },
    ],
  },
]);
