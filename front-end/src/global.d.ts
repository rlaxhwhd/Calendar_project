export {}; // (모듈 컨텍스트 보장용, 안전)
declare global {
  interface Window {
    iv_month?: Date; // Date | undefined
  }
}