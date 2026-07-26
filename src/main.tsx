import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { initTheme } from "./lib/theme";
import { initTailleTexte } from "./lib/tailleTexte";
import { initialiserContenuSiVide, migrerDouleurVersEva } from "./data/repositories/contenuRepository";
import { initialiserContenuReactif } from "./data/contenuInit";
import "./styles/tokens.css";

initTheme();
initTailleTexte();
initialiserContenuReactif();
void initialiserContenuSiVide().then(migrerDouleurVersEva);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
