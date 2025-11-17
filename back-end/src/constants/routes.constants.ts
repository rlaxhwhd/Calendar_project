//API 기본 접두사
export const API_PREFIX = '/api/v1';

//auth 관련 접두사
export const AUTH_ROUTES = {
  BASE: '/auth',

  // Google OAuth
  GOOGLE: '/google',
  GOOGLE_CALLBACK: '/google/callback',

  // 신규 사용자 최종 등록 및 로그인
  SIGNUP: '/register',

  // 토큰 갱신
  REFRESH: '/refresh',

  // 로그아웃
  LOGOUT: '/logout',
};

//proxy 관련 접두사
export const PROXY_ROUTES = {
  BASE: '/proxy',
  PUBLIC_DATA: '/publicdata',
};
