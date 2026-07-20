import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { semerDonneesDemoSiPremierLancement } from "./data/demoData";
import "./styles/tokens.css";

semerDonneesDemoSiPremierLancement();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
