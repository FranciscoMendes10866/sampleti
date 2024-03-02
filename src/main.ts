import { createClient, type NormalizeOAS } from "fets";
import moize from "moize";
import ms from "ms";

import { openapi } from "./openapi";
import { useAuthPlugin, type AuthPluginOpts } from "./plugins";

//
// definitions
//

const opts = {
  refreshToken: moize.promise(
    async () => {
      return {
        accessToken: "",
        refreshToken: "",
      };
    },
    { maxAge: ms("7 seconds") }
  ),
  actions: {
    getTokens() {
      return {
        accessToken: localStorage.getItem("accessToken") || "",
        refreshToken: localStorage.getItem("refreshToken") || "",
      };
    },
    setTokens(tokens) {
      localStorage.setItem("accessToken", tokens.accessToken);
      localStorage.setItem("refreshToken", tokens.refreshToken);
    },
    clearTokens() {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
} satisfies AuthPluginOpts;

const client = createClient<NormalizeOAS<typeof openapi>>({
  endpoint: "https://jsonplaceholder.typicode.com/",
  plugins: [useAuthPlugin(opts)],
});

//
// http client
//

const result = await client["/posts/{id}"].get({ params: { id: 3 } });

await result.json();
