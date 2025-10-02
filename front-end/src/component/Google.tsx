import React from "react";
import "./Google.scss";

export function Google_get_access_token() {
  function handleRedirectCallback(): void {
    const {
      access_token,
      token_type,
      expires_in,
      state,
    }: Record<string, string> = parseFragment();

    console.log("Access Token:", access_token);
    console.log("Token Type:", token_type);
    console.log("Expires In:", expires_in);
    console.log("State:", state);    
    window.opener.location.href = "/main";
    window.close();
  }

  function parseFragment(): Record<string, string> {
    const fragment: Record<string, string> = {};
    const fragmentString: string = window.location.hash.substring(1);

    if (fragmentString === "error=access_denied") {
      window.close();
    }

    const fragmentParams: string[] = fragmentString.split("&");
    for (const param of fragmentParams) {
      const [key, value]: string[] = param.split("=");
      fragment[key] = decodeURIComponent(value);
    }
    return fragment;
  }

  handleRedirectCallback();

  return <></>;
}

export function GoogleBtn(props: { state: "login" | "sign_up" }) {
  function lf_oauthSignIn_google() {
    var screenWidth = window.screen.width;
    var screenHeight = window.screen.height;

    var width = 650;
    var height = 800;

    // 창의 가운데 위치 계산
    var left = (screenWidth - width) / 2;
    var top = (screenHeight - height) / 2;

    var newWindow = window.open(
      "",
      "_blank",
      "width=" +
        width +
        ", height=" +
        height +
        ", left=" +
        left +
        ", top=" +
        top
    );

    var oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

    var form = document.createElement("form");
    form.setAttribute("method", "GET");
    form.setAttribute("action", oauth2Endpoint);

    var params = {
      client_id:
        "794723824545-tnhvhech192p9tlpdf4b031j70bvsnoa.apps.googleusercontent.com",
      redirect_uri: `${window.origin}/login/google_signup`,
      response_type: "token",
      scope: "email profile",
      state: props.state,
    };

    for (var p in params) {
      var input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", p);

      //@ts-ignore
      input.setAttribute("value", params[p]);
      form.appendChild(input);
    }

    newWindow?.document.body.appendChild(form);
    form.submit();
  }

  return (
    <button
      type="submit"
      style={{ border: "none", borderRadius: "5px", padding: "10px" }}
      onClick={() => {
        lf_oauthSignIn_google();
      }}
      className="gbtn"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 0 24 24"
        width="24"
      >
        <script />
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
        <path d="M1 1h22v22H1z" fill="none" />
        <script />
      </svg>
      <span className="text"></span>
      구글 계정으로 {props.state === "sign_up" ? "회원가입" : "로그인"}하기
    </button>
  );
}
