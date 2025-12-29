import React, { useState } from "react";
import axios from "axios";
import "./LinkGenerateButton.scss";
import { Main } from "@jsLib/class/Main";
import { useNavigate } from "react-router";
import { useRefreshToken } from "@jsLib/hooks/useAuthPipeline";

export default function LinkGeneratorButton() {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [hostNickname, setHostNickname] = useState("");

  const lv_navigate = useNavigate();
  const refreshToken = useRefreshToken();

  const handleCreateCalendar = async () => {
    try {
      // 유효성 검사
      if (!title.trim()) {
        Main.im_toast("캘린더 제목을 입력해주세요", "warn");
        return;
      }
      if (!startDate) {
        Main.im_toast("시작일을 선택해주세요", "warn");
        return;
      }
      if (!endDate) {
        Main.im_toast("종료일을 선택해주세요", "warn");
        return;
      }
      if (!hostNickname.trim()) {
        Main.im_toast("닉네임을 입력해주세요", "warn");
        return;
      }

      // 날짜 유효성 검사
      if (new Date(startDate) > new Date(endDate)) {
        Main.im_toast("종료일은 시작일보다 이후여야 합니다", "warn");
        return;
      }

      setLoading(true);

      // 토큰 갱신
      const { accessToken } = await refreshToken();

      // 캘린더 생성 API 호출
      const response = await axios.post(
        "/api/v1/calendars",
        {
          title,
          start_date: startDate,
          end_date: endDate,
          description: description.trim() || undefined,
          hostNickname,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        }
      );

      const { calendar, shareUrl, participantToken } = response.data;

      // 참가자 토큰 저장 (필요시)
      if (participantToken) {
        localStorage.setItem("participantToken", participantToken);
      }

      Main.im_toast("캘린더가 생성되었습니다!", "success");

      // 공유 링크 복사
      if (navigator.clipboard && shareUrl) {
        await navigator.clipboard.writeText(shareUrl);
        Main.im_toast("링크가 클립보드에 복사되었습니다", "success");
      }

      // 생성된 캘린더 페이지로 이동
      setTimeout(() => {
        lv_navigate(`/calendar?slug=${calendar.slug}`);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || "캘린더 생성에 실패했습니다";
      Main.im_toast(errorMessage, "warn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="asnbdfujbrbw">
      <main className="hero">
        <h1 className="hero__title">캘린더 생성하기</h1>
        <p className="hero__desc">
          모임 날짜를 투표할 캘린더를 만들어보세요
        </p>

        <div className="form-container">
          <div className="form-group">
            <label htmlFor="title">캘린더 제목 *</label>
            <input
              id="title"
              type="text"
              placeholder="예: 팀 회식 날짜 투표"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="hostNickname">내 닉네임 *</label>
            <input
              id="hostNickname"
              type="text"
              placeholder="예: 홍길동"
              value={hostNickname}
              onChange={(e) => setHostNickname(e.target.value)}
              maxLength={20}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">시작일 *</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">종료일 *</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">설명 (선택)</label>
            <textarea
              id="description"
              placeholder="모임에 대한 간단한 설명을 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </div>

        <div className="cta-bar">
          <button
            type="button"
            className="button button--secondary"
            onClick={() => lv_navigate("/group")}
          >
            <span className="button__text">내 모임 관리</span>
          </button>
          <button
            type="button"
            className={`button ${loading ? "button--loading" : ""}`}
            onClick={handleCreateCalendar}
            disabled={loading}
          >
            <span className="button__text">
              {loading ? "생성 중..." : "캘린더 생성"}
            </span>
          </button>
        </div>
      </main>
    </section>
  );
}
