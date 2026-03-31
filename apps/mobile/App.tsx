import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import "./global.css";
import { syncRouterWithLinking } from "./src/linking/syncRouterWithLinking";
import { router } from "./src/router/router";

export default function App() {
  useEffect(() => syncRouterWithLinking(router), []);

  return <RouterProvider router={router} />;
}
