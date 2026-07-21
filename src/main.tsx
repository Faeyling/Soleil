import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { semerDonneesDemoSiPremierLancement } from "./data/demoData";
import { initTheme } from "./lib/theme";
import "./styles/tokens.css";

initTheme();
semerDonneesDemoSiPremierLancement();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
