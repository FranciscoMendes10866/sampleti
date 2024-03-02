import type { ClientPlugin } from "fets";
import fetchRetry from "fetch-retry";

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthPluginOpts = {
  refreshToken: () => Promise<Tokens>;
  actions: {
    getTokens: () => Tokens;
    setTokens: (tokens: Tokens) => void;
    clearTokens: () => void;
  };
  trace?: (exception: Error | null) => Promise<void>;
};

export function useAuthPlugin(opts: AuthPluginOpts): ClientPlugin {
  return {
    onRequestInit({ requestInit }) {
      requestInit.headers = {
        ...requestInit.headers,
        Authorization: `Bearer ${opts.actions.getTokens().accessToken}`,
      };
    },
    onFetch({ fetchFn, setFetchFn }) {
      setFetchFn(
        fetchRetry(fetchFn as any, {
          retryDelay: (attempt) => Math.pow(2, attempt) * 1200,
          retryOn: async (attempt, exception, response) => {
            if (exception !== null) {
              await opts.trace?.(exception);
            }

            if (attempt > 2) return false;

            if (response?.status === 401) {
              const tokens = await opts.refreshToken();

              if (!tokens?.accessToken) {
                opts.actions.clearTokens();
                return false;
              }

              opts.actions.setTokens(tokens);
              return true;
            }

            return false;
          },
        })
      );
    },
  };
}
