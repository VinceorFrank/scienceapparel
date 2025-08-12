import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LangProvider } from "./utils/lang";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Expose globally so utils/auth.js can clear cache without import coupling
window.__queryClient = queryClient;

ReactDOM.createRoot(document.getElementById("root")).render(
  <LangProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </LangProvider>
);