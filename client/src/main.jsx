import './index.css';
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LangProvider } from "./utils/lang";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <LangProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </LangProvider>
);