import React, { useState } from "react";
import axios from "axios";
import "./LinkGenerateButton.scss";
import { Main } from "@jsLib/class/Main";
import { useNavigate } from "react-router";

export default function LinkGeneratorButton() {
  const [loading, setLoading] = useState(false);
  const lv_navigate = useNavigate();
  const handleClick = async () => {
    try {
      setLoading(true);
      // axios 요청 예시
      // axios 대신 setTimeout으로 응답 지연 흉내
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const res = await axios.get("/zzzzzzzzzzzzzzzz/zzzzzzzzzzz");
      console.log(res.data);
      Main.im_toast("링크 생성 완료", "success");
    } catch (err) {
      console.error(err);
      Main.im_toast("링크 생성 실패", "warn");
    } finally {
      setLoading(false);
    }
  };  

  return (
    <section id="asnbdfujbrbw">
      <main className="hero">
        <h1 className="hero__title">공유 링크를 만들어요</h1>
        <p className="hero__desc">
          버튼을 누르면 링크가 생성되고 자동으로 복사됩니다.
        </p>
        <div className="content-dummy" />
        <div className="cta-bar">
          <button
            type="button"
            className={`button ${""}`}
            onClick={()=>{lv_navigate("/group")}}            
          >
            <span className="button__text">
              {loading ? "Loading..." : "내 모임 관리"}
            </span>
          </button>
          <button
            type="button"
            className={`button ${loading ? "button--loading" : ""}`}
            onClick={handleClick}
            disabled={loading}
          >
            <span className="button__text">
              {loading ? "Loading..." : "링크 생성"}
            </span>
          </button>
        </div>
      </main>
    </section>
  );
}

