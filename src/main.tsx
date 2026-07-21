import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { initTheme } from "./lib/theme";
import { initialiserContenuSiVide } from "./data/repositories/contenuRepository";
import { initialiserContenuReactif } from "./data/contenuInit";
import "./styles/tokens.css";

initTheme();
initialiserContenuReactif();
void initialiserContenuSiVide();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
