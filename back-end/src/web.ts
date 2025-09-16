import express, { Request, Response, NextFunction } from "express";
const app = express();
import path from "path";
import session from "express-session";
var MySQLStore = require("express-mysql-session")(session);
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// .env 파일에서 환경 변수 로드
dotenv.config();

declare module "express-session" {
  export interface SessionData {
    userId: number;
    email: string;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    session: session.Session & Partial<session.SessionData>;
  }
}

//https://expressjs.com/ko/starter/static-files.html s
app.set("puplic", path.join(__dirname, "../build"));
app.use(express.static(app.settings.puplic));

app.use(cookieParser());

const sessionMiddleware = session({
  secret: "subscribe_loutbtbahah4281!@",
  resave: true,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 * 7,
  },
});

app.use(sessionMiddleware);
app.use("/data", express.static(path.join(__dirname, "../../data")));
app.use(
  "/assets", //  /assets/* 요청
  express.static(path.join(__dirname, "../assets"))
);

// ② React 번들의 정적 파일
app.use(
  express.static(path.join(__dirname, "../build"), {
    index: false, // index.html 은 직접 라우트에서 전송
  })
);

app.use((err: any, req: any, res: any, next: any) => {
  // 이미 헤더가 전송됐다면 Express 기본 처리에 맡김
  if (res.headersSent) {
    return;
  }

  // 로그 남기기
  console.error(err);

  // 커스텀 에러에 statusCode 있으면 사용, 없으면 500
  const status = err.statusCode ?? 500;

  res.status(status).json({
    err: true,
    msg: "서버 오류가 발생했습니다.",
  });
});

import publicdata from './router/proxy/publicdata';
app.use("/proxy/publicdata",publicdata);


// ⑤ React SPA 용 catch‑all
app.get("*", (_: any, res: { sendFile: (arg0: string) => void }) => {
  res.sendFile(path.join(__dirname, "../build/index.html"));
});

console.log(
  "[routes]",
  app._router.stack
    .filter((l: { route: any }) => l.route)
    .map(
      (l: { route: { methods: {}; path: any } }) =>
        `${Object.keys(l.route.methods)[0].toUpperCase()} ${l.route.path}`
    )
);

const server = app.listen(3002, () => {
  console.log(`Example app listening on port ${3002}`);
});

server.keepAliveTimeout = 300; // Keep-Alive 연결 제한 시간
server.headersTimeout = 11000; // 헤더 대기 시간

export default app;
