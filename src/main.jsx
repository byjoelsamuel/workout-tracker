import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import "@fontsource-variable/rubik";
import "@fontsource-variable/pixelify-sans";
import "./styles/global.css";
import { registerServiceWorker } from "./lib/serviceWorker.js";
import { setUpAndroidBackButton } from "./lib/platform.js";

registerServiceWorker();
setUpAndroidBackButton();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  </StrictMode>
);
