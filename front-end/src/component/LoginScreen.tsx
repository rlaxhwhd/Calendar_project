import React from "react";
import "./LoginScreen.scss";

export default function NicknameScreen() {
  return (
    <main className="screen" role="main">
      <header className="header">
        <h1 className="title">닉네임</h1>
        <p className="subtitle">한글/영문/숫자/밑줄(_)만 사용, 2–12자</p>
      </header>

      <section className="form">
        <label htmlFor="nickname" className="label">닉네임</label>

        <div className="inputWrap">
          <input
            id="nickname"
            className="input"
            type="text"
            inputMode="text"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="예) 홍길동_01"
            maxLength={12}
            aria-describedby="nickname-help"
          />
        </div>

        <p id="nickname-help" className="help">
          한글/영문/숫자/밑줄(_)만 사용, 2–12자
        </p>

        {/* 정적 오류 영역 (UI만 표시, 항상 숨김) */}
        <p className="error" hidden aria-live="polite">
          오류 메시지
        </p>
      </section>

      <footer className="footer">
        <button onClick={()=>{
            window.location.href="/calendar"
        }} type="button" className="primaryBtn">계속</button>
      </footer>
    </main>
  );
}
