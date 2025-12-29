import React from "react";
import "./MainLanding.scss";
import TentImage from "@img/tent_clean.png";
import FireImage from "@img/fire.png";
import { useGoogleOAuthSignIn } from "@jsLib/hooks/useAuthPipeline";

const bubbles = [
  { icon: "🍆", text: "너무 굶어서 그래. 밥부터 먹어" },
  { icon: "🍒", text: "매운치약으로 양치 빡빡해봐" },
  { icon: "🐷", text: "간식 어떻게 끊음?" },
];

export default function MainLanding() {
  const lf_login_google = useGoogleOAuthSignIn({ state:"login" });
  const lf_signup_google = useGoogleOAuthSignIn({ state:"sign_up" });
  return (
    <div className="mainLanding">
      <section className="mainLanding__card" aria-label="mainPage onboarding">
        <div>
          <div className="mainLanding__logoText">
            <p>친구와 함께하는 다이어트</p>
            <div className="mainLanding__logo">
              <img
                src={FireImage}
                alt="mainPage 로고"
                className="mainLanding__logoImage"
              />
              <strong className="mainLanding__wordmarkText">Zette</strong>
            </div>
          </div>
        </div>

        <ul className="mainLanding__bubbles">
          {bubbles.map((bubble) => (
            <li key={bubble.text} className="mainLanding__bubble">
              <span className="mainLanding__bubbleIcon" aria-hidden="true">
                {bubble.icon}
              </span>
              <span>{bubble.text}</span>
            </li>
          ))}
        </ul>

        <div className="mainLanding__camp" aria-hidden="true">
          <img src={TentImage} alt="캠핑 텐트" />
        </div>

        <button onClick={lf_signup_google} type="button" className="mainLanding__primary">
          새롭게 시작하기
        </button>

        <button onClick={lf_login_google} type="button" className="mainLanding__secondary">
          기존 계정으로 로그인
        </button> 
      </section>
    </div>
  );
}
