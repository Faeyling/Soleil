import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { AccueilPage } from "../features/accueil/AccueilPage";
import { SymptomesListePage } from "../features/symptomes/SymptomesListePage";
import { SymptomeFormPage } from "../features/symptomes/SymptomeFormPage";
import { MedicamentsPage } from "../features/medicaments/MedicamentsPage";
import { MedicamentFormPage } from "../features/medicaments/MedicamentFormPage";
import { SuivisListePage } from "../features/suivis/SuivisListePage";
import { SuiviFormPage } from "../features/suivis/SuiviFormPage";
import { ParcoursQuotidienPage } from "../features/parcours/ParcoursQuotidienPage";
import { HistoriquePage } from "../features/historique/HistoriquePage";
import { RessourcesPage } from "../features/ressources/RessourcesPage";
import { ProfilPage } from "../features/profil/ProfilPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <AccueilPage /> },
      { path: "symptomes", element: <SymptomesListePage /> },
      { path: "symptomes/:id", element: <SymptomeFormPage /> },
      { path: "medicaments", element: <MedicamentsPage /> },
      { path: "medicaments/:id", element: <MedicamentFormPage /> },
      { path: "suivis", element: <SuivisListePage /> },
      { path: "suivis/:id", element: <SuiviFormPage /> },
      { path: "parcours", element: <ParcoursQuotidienPage /> },
      { path: "historique", element: <HistoriquePage /> },
      { path: "ressources", element: <RessourcesPage /> },
      { path: "profil", element: <ProfilPage /> },
    ],
  },
]);
