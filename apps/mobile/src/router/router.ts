import { createBrowserHistory, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { Platform } from "react-native";
import { routeTree } from "./routes";

const history =
  Platform.OS === "web" ? createBrowserHistory() : createMemoryHistory({ initialEntries: ["/"] });

export const router = createRouter({
  routeTree,
  history,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
