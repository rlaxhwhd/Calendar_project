import axios from "axios";
import { useCallback, useEffect, useState } from "react";
/**
 * @jun-seok816
 * 경험상 로그인 로그아웃은 navigation 안쓰고 걍 리다이렉션 하는게 좋음
 */
import { API_PREFIX, AUTH_ROUTES } from "../constants/routes.constants";

const AUTH_BASE = `${API_PREFIX}${AUTH_ROUTES.BASE}`;
const AUTH_ENDPOINTS = {
  GOOGLE: `${AUTH_BASE}${AUTH_ROUTES.GOOGLE}`,
  SIGNUP: `${AUTH_BASE}${AUTH_ROUTES.SIGNUP}`,
  REFRESH: `${AUTH_BASE}${AUTH_ROUTES.REFRESH}`,
  ME: `${AUTH_BASE}${AUTH_ROUTES.ME}`,
  LOGOUT: `${AUTH_BASE}${AUTH_ROUTES.LOGOUT}`,
};

type GoogleOAuthState = "login" | "sign_up";

type AuthUser = {
  user_uuid: string;
  email: string;
  oauth_provider: "google" | "kakao";
  nickname: string;
  profile_image_url: string;
  isTermsAgreed: boolean;
  created_at: string;
};

interface UseGoogleOAuthSignInOptions {
  state: GoogleOAuthState;
  width?: number;
  height?: number;
  clientId?: string;
}

type GoogleSignupPayload = {
  token: string;
  isTermsAgreed: boolean;
};

export function useGoogleOAuthSignIn({ state }: UseGoogleOAuthSignInOptions) {
  return useCallback(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams({ state });
    const targetUrl = `${AUTH_ENDPOINTS.GOOGLE}?${searchParams.toString()}`;

    window.location.href = targetUrl;
  }, [state]);
}

export function useGoogleSignup() {
  return useCallback(async (payload: GoogleSignupPayload) => {
    const res = await axios.post(AUTH_ENDPOINTS.SIGNUP, payload, {
      withCredentials: true,
    });

    return res.data;
  }, []);
}

export function useRefreshToken() {
  return useCallback(async () => {
    const res = await axios.post(AUTH_ENDPOINTS.REFRESH, null, {
      withCredentials: true,
    });

    return res.data;
  }, []);
}

export function useLogout() {
  return useCallback(async () => {
    axios
      .post(AUTH_ENDPOINTS.LOGOUT, null, {
        withCredentials: true,
      })
      .finally(() => {
        window.location.href = "/";
      });
  }, []);
}

export function useRequireAuth(redirectTo = "/") {
  const refreshToken = useRefreshToken();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const { accessToken } = await refreshToken();
        const userRes = await axios.get(AUTH_ENDPOINTS.ME, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });

        if (isMounted) {
          setUser(userRes.data.user ?? userRes.data);
          setIsVerified(true);
        }
      } catch (error) {
        if (isMounted) {
          if (typeof window !== "undefined") {
            alert("로그인 만료");
            window.location.replace(redirectTo);
          }
        }
      } finally {
        if (isMounted) {
          setIsChecking(false);
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [redirectTo, refreshToken]);

  return { isVerified, isChecking, user };
}
