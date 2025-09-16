import { Router } from "express";
import axios from "axios";
const r = Router();

r.get("/holidays", async (req, res, next) => {
  try {
    const year = String(req.query.year ?? "2025").trim();
    const month = String(req.query.month ?? "09").padStart(2, "0");

    const { data } = await axios.get(
      "http://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo",
      {
        params: {
          ServiceKey: process.env.GET_REST_DE_INFO,
          solYear: year,
          solMonth: month,
          numOfRows: 100,
          _type: "json",
        },
      }
    );

    const header = data?.response?.header;
    const items = data?.response?.body?.items?.item ?? [];

    if (!header || header.resultCode !== "00") {
      res
        .status(502)
        .json({
          error: header?.resultMsg || "Upstream error",
          code: header?.resultCode,
        });
      return;
    }

    // 배열/단일 모두 대응
    res.json(Array.isArray(items) ? items : [items]);
  } catch (err) {
    console.error(err);
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 500;
      const msg = err.response?.data || err.message;
      res
        .status(status >= 500 ? 502 : status)
        .json({ error: "데이터 호출 실패", detail: msg });
      return;
    }
    res.status(500).json({ error: "데이터 호출 실패" });
    return;
  }
});

export default r;
