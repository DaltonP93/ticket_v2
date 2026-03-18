import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { TicketSystemProvider } from "./store";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <TicketSystemProvider>
      <App />
    </TicketSystemProvider>
  </React.StrictMode>
);
