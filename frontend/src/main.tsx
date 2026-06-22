import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/providers/AppProviders";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { routerBasename } from "@/lib/env";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename()}>
      <AppProviders>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AppProviders>
    </BrowserRouter>
  </React.StrictMode>,
);
