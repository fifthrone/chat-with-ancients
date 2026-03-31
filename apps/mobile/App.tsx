import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import "./global.css";
import { syncRouterWithLinking } from "./src/linking/syncRouterWithLinking";
import { router } from "./src/router/router";

const queryClient = new QueryClient();

export default function App() {
  useEffect(() => syncRouterWithLinking(router), []);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
