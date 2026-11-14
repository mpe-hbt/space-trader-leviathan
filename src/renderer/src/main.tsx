import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./theme/fonts";
import "./theme/global.css";
import { applyTheme } from "./theme/apply";
import { App } from "./App";

applyTheme(document);

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root is missing");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
