import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import "@fontsource-variable/rubik";
import "./styles/global.css";
import { registerServiceWorker } from "./lib/serviceWorker.js";

registerServiceWorker();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </StrictMode>
);
