# Availability Calendar with Holidays

## 환경/버전
- **Node.js**: v20.19.5  
- **npm**: 10.8.2  
- 프런트엔드: React + react-day-picker  
- 백엔드: Express + axios

---

## 개요
- **react-day-picker**로 달력을 렌더링합니다.
- **프록시 API**(`/proxy/publicdata/holidays`)로 공공데이터포털 휴일 데이터를 불러옵니다.
- 달력에 **휴일 표시/비활성화/스타일링**을 적용합니다.

---

## 설정

### 1) .env
```env
GET_REST_DE_INFO=발급받은_공공데이터포털_API_키
```