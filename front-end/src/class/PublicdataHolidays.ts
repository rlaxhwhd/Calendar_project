// 필요 시 사용: import axios from "axios";

import axios from "axios";
import { Main } from "./Main";

export interface HolidayItem {
  dateName: string; // 공휴일명
  locdate: number; // 20250914 같은 정수 yyyyMMdd
  isHoliday: boolean; // true
  seq?: number; // 선택
}

export class PublicdataHolidays {
  public im_forceRender: () => void;

  public iv_year: string;
  public iv_month: string; // 항상 2자리 ("01"~"12")

  public iv_holidays: HolidayItem[]; // 결과 데이터
  public iv_loading: boolean = false;
  public iv_error: string | null = null;

  private basePath: string;

  constructor(im_forceRender: () => void) {
    this.im_forceRender = im_forceRender;
  
    const now = new Date();
    this.iv_year = String(now.getFullYear());
    this.iv_month = String(now.getMonth() + 1).padStart(2, "0");
  
    this.iv_holidays = [];
    this.basePath = "/proxy/publicdata";
  }

  /** 연/월 세팅 */
  public im_setYearMonth(year: string | number, month: string | number) {
    this.iv_year = String(year);
    this.iv_month = PublicdataHolidays.sf_pad2(String(month));
  }

  /** 프록시 라우터 호출하여 iv_holidays 초기화 */
  public async im_fetchHolidays() {
    const year = this.iv_year.trim();
    const month = this.iv_month.trim();

    if (!/^\d{4}$/.test(year)) {
      Main.im_toast("연도 형식이 올바르지 않습니다. 예: 2025", "warn");
      return;
    }
    if (!/^(0[1-9]|1[0-2])$/.test(month)) {
      Main.im_toast("월 형식이 올바르지 않습니다. 예: 01~12", "warn");
      return;
    }

    this.iv_loading = true;
    this.iv_error = null;
    this.im_forceRender();

    try {
      const res = await axios.get(`${this.basePath}/holidays`, {
        params: { year, month },
      });

      // 라우터가 배열을 반환하도록 구현했다면 그대로, 아닐 경우 안전 처리
      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.response?.body?.items?.item ?? [];

      this.iv_holidays = (Array.isArray(raw) ? raw : [raw])
        .filter(Boolean)
        .map(
          (it: any): HolidayItem => ({
            dateName: it.dateName,
            locdate: Number(it.locdate),
            isHoliday:
              it.isHoliday === true ||
              it.isHoliday === "Y" ||
              it.isHoliday === "y",
            seq: it.seq != null ? Number(it.seq) : undefined,
          })
        )
        .sort((a, b) => a.locdate - b.locdate);

      //Main.im_toast("공휴일 데이터를 불러왔습니다.", "info");      
    } catch (e) {
      console.error(e);
      this.iv_error = "공공데이터 호출 실패";
      Main.im_toast(this.iv_error, "error");
    } finally {
      this.iv_loading = false;
      this.im_forceRender();
    }
  }

  /** yyyyMMdd -> yyyy-MM-dd */
  public static sf_formatLocdate(locdate: number | string) {
    const s = String(locdate);
    if (!/^\d{8}$/.test(s)) return s;
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }

  /** '9' -> '09' */
  public static sf_pad2(v: string) {
    return v.padStart(2, "0");
  }
}
