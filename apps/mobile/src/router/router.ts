import { createBrowserHistory, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { Platform } from "react-native";
import { routeTree } from "./routes";

const history =
  Platform.OS === "web" ? createBrowserHistory() : createMemoryHistory({ initialEntries: ["/"] });

const webBasepath = "/chat-with-ancients";

export const router = createRouter({
  routeTree,
  history,
  basepath: Platform.OS === "web" ? webBasepath : undefined,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
