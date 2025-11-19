import { useCallback } from "react";

type GoogleOAuthState = "login" | "sign_up";

interface UseGoogleOAuthSignInOptions {
  state: GoogleOAuthState;
  width?: number;
  height?: number;
  clientId?: string;
}

const GOOGLE_OAUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const DEFAULT_CLIENT_ID =
  "794723824545-tnhvhech192p9tlpdf4b031j70bvsnoa.apps.googleusercontent.com";

export function useGoogleOAuthSignIn({
  state,
  width = 650,
  height = 800,
  clientId = DEFAULT_CLIENT_ID,
}: UseGoogleOAuthSignInOptions) {
  return useCallback(() => {
    if (typeof window === "undefined") return;

    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const left = (screenWidth - width) / 2;
    const top = (screenHeight - height) / 2;

    const targetWindow =
      window.open(
        "",
        "_blank",
        `width=${width}, height=${height}, left=${left}, top=${top}`
      ) ?? window;

    const form = targetWindow.document.createElement("form");
    form.method = "GET";
    form.action = GOOGLE_OAUTH_ENDPOINT;

    const params: Record<string, string> = {
      client_id: clientId,
      redirect_uri: `${window.origin}/login/google_signup`,
      response_type: "token",
      scope: "email profile",
      state,
    };

    Object.entries(params).forEach(([key, value]) => {
      const input = targetWindow.document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    targetWindow.document.body.appendChild(form);
    form.submit();
  }, [state, width, height, clientId]);
}
