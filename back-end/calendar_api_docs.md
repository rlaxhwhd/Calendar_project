# 📅 Calendar App API 통합 명세서

## 목차

1. [기본 정보](#기본-정보)
2. [토큰 가이드](#토큰-가이드)
3. [인증 API](#1-인증-auth-api)
4. [캘린더 API](#2-캘린더-calendar-api)
5. [참가자 API](#3-참가자-participant-api)
6. [투표 API](#4-투표-vote-api)
7. [공공 데이터 API](#5-공공-데이터-proxy-api)
8. [실시간 통신 (Socket.IO)](#6-실시간-통신-socketio)

---

## 기본 정보

- **Base URL**: `/api/v1`
- **Data Format**: JSON
- **Error Response**:
  ```json
  {
    "success": false,
    "message": "에러 메시지"
  }
  ```

---

## 토큰 가이드

본 API는 JWT(JSON Web Tokens)를 사용하여 인증 및 인가를 관리합니다. 용도에 맞는 토큰을 발급받아 사용해야 합니다.

### 주요 토큰 종류

| 토큰 종류             | 주 목적                            | 전송 방식         | 유효 기간        |
| --------------------- | ---------------------------------- | ----------------- | ---------------- |
| **Access Token**      | 인증된 사용자의 API 요청 권한 증명 | Cookie (HttpOnly) | 짧음 (3시간)     |
| **Refresh Token**     | Access Token 재발급                | Cookie (HttpOnly) | 김 (7일)         |
| **Signup Token**      | 회원가입 절차 완료                 | Body              | 매우 짧음 (10분) |
| **Participant Token** | 특정 캘린더 접근 및 상호작용       | Header            | 중간 (7일)       |

### 1. Access Token (액세스 토큰)

- **역할**: 로그인한 사용자를 식별하고 보호된 API 리소스에 접근
- **사용 흐름**:
  1. 로그인 성공 시 서버가 HttpOnly 쿠키로 발급
  2. 브라우저가 모든 API 요청에 자동으로 쿠키 포함
  3. 서버가 매 요청마다 토큰 검증
- **클라이언트 처리**: 자동으로 쿠키에 저장되므로 별도 관리 불필요

### 2. Refresh Token (리프레시 토큰)

- **역할**: Access Token 만료 시 새로운 토큰 발급
- **사용 흐름**:
  1. API 요청 시 401 Unauthorized 에러 발생
  2. `/api/v1/auth/refresh` 호출 (리프레시 토큰 쿠키 자동 전송)
  3. 새로운 Access Token 발급
  4. 실패했던 요청 재시도
- **클라이언트 처리**: 401 에러 시 자동 재발급 로직 구현 필요

### 3. Signup Token (회원가입 토큰)

- **역할**: 다단계 회원가입 절차를 안전하게 완료
- **사용 흐름**:
  1. Google OAuth 콜백에서 신규 사용자 확인 시 발급
  2. 회원가입 완료 API 요청 시 Body에 포함
  3. 서버가 토큰 검증 후 회원가입 완료
- **클라이언트 처리**: 회원가입 완료 전까지 임시 저장 필요

### 4. Participant Token (참가자 토큰)

- **역할**: 특정 캘린더의 참가자가 참여하고 활동(회원, 비회원과 관계없이 캘린더의 모든 참가자는 참가자 토큰을 가져야 함)
- **사용 흐름**:
  1. 캘린더 참가 시 서버가 발급
  2. 해당 캘린더 관련 API 요청 시 `Authorization: Bearer <token>` 헤더에 포함
  3. 서버가 캘린더별 참여자 식별 및 권한 확인
- **클라이언트 처리**: localStorage나 변수에 저장하고 API 요청마다 헤더에 포함

---

## 1. 인증 (Auth API)

Google OAuth를 이용한 로그인, 회원가입, 토큰 갱신 기능을 제공합니다.

### 1-1. Google 로그인 리다이렉트

사용자를 구글 로그인 페이지로 이동시킵니다.

- **Endpoint**: `GET /auth/google`
- **Auth**: 불필요
- **Description**: Google OAuth 인증 URL로 리다이렉트

### 1-2. Google 로그인 콜백

Google 인증 후 리다이렉트되는 콜백 URL입니다.

- **Endpoint**: `GET /auth/google/callback`
- **Auth**: 불필요
- **Query Parameters**:
  - `code` (string, required): Google 인증 코드

#### Response (Case 1: 기존 회원 로그인)

- **Status**: `200 OK`
- **Cookie**: `jwt` (Refresh Token, HttpOnly)
- **Body**:
  ```json
  {
    "message": "로그인 성공",
    "isNewUser": false,
    "token": "eyJhbG...",
    "user": {
      "user_uuid": "...",
      "email": "user@gmail.com",
      "nickname": "사용자닉네임",
      "profile_image_url": "https://...",
      "isTermsAgreed": true,
      "created_at": "2024-..."
    }
  }
  ```

#### Response (Case 2: 신규 회원)

- **Status**: `200 OK`
- **Body**:
  ```json
  {
    "message": "신규 사용자입니다. 회원가입을 진행해주세요.",
    "token": "eyJhbG..."
  }
  ```

### 1-3. 신규 회원가입 완료

약관 동의 등 추가 절차를 거쳐 회원가입을 완료합니다.

- **Endpoint**: `POST /auth/register`
- **Auth**: Signup Token (Body에 포함)
- **Request Body**:
  ```json
  {
    "token": "eyJhbG...",
    "isTermsAgreed": true
  }
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Cookie**: `jwt` (Refresh Token, HttpOnly)
  - **Body**:
    ```json
    {
      "message": "회원가입 및 로그인 성공",
      "token": "eyJhbG...",
      "user": {
        /* User 정보 */
      }
    }
    ```

### 1-4. Access Token 갱신

Refresh Token을 사용하여 새로운 Access Token을 발급받습니다.

- **Endpoint**: `POST /auth/refresh`
- **Auth**: Cookie (`jwt` Refresh Token)
- **Request Body**: 없음
- **Response**:
  - **Status**: `200 OK`
  - **Cookie**: `jwt` (갱신된 Refresh Token)
  - **Body**:
    ```json
    {
      "message": "토큰 갱신 성공",
      "accessToken": "eyJhbG..."
    }
    ```

### 1-5. 로그아웃

Refresh Token을 무효화하고 쿠키를 삭제합니다.

- **Endpoint**: `POST /auth/logout`
- **Auth**: Cookie (`jwt` Refresh Token)
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "로그아웃 성공"
    }
    ```

---

## 2. 캘린더 (Calendar API)

모임 날짜 투표를 위한 캘린더를 관리합니다.

### 2-1. 캘린더 생성

새로운 캘린더를 생성합니다. 생성자는 자동으로 '방장(Host)'으로 참여합니다.

- **Endpoint**: `POST /calendars`
- **Auth**: User Token (Header: `Authorization: Bearer <token>`)
- **Request Body**:
  ```json
  {
    "title": "연말 모임",
    "start_date": "2024-12-01",
    "end_date": "2024-12-31",
    "hostNickname": "방장닉네임",
    "description": "모임 설명입니다."
  }
  ```
- **Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "message": "캘린더가 생성되었습니다",
      "calendar": {
        "slug": "Ab3dE9xR...",
        "title": "연말 모임",
        "description": "모임 설명입니다.",
        "start_date": "2024-12-01T00:00:00.000Z",
        "end_date": "2024-12-31T00:00:00.000Z",
        "is_closed": false,
        "hostUuid": "참가자UUID",
        "created_at": "...",
        "expired_at": "..."
      },
      "shareUrl": "http://client-url/calendar/Ab3dE9xR...",
      "participantToken": "eyJhbG..."
    }
    ```

### 2-2. 내 캘린더 목록 조회

로그인한 사용자가 생성한(방장인) 캘린더 목록을 조회합니다.

- **Endpoint**: `GET /calendars/my`
- **Auth**: User Token (Header: `Authorization: Bearer <token>`)
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "calendars": [
        {
          "slug": "...",
          "title": "..."
        }
      ],
      "count": 5
    }
    ```

### 2-3. 캘린더 상세 조회

공유 링크(slug)를 통해 캘린더 정보를 조회합니다.

- **Endpoint**: `GET /calendars/:slug`
- **Auth**: 불필요
- **Path Parameters**: `slug` - 캘린더 고유 ID
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "calendar": {
        /* SafeCalendar 객체 */
      }
    }
    ```

### 2-4. 캘린더 수정

캘린더 정보를 수정합니다. **방장(Host) 권한** 필요.

- **Endpoint**: `PATCH /calendars/:slug`
- **Auth**: Participant Token (Header, Host 권한)
- **Path Parameters**: `slug`
- **Request Body** (변경할 필드만):
  ```json
  {
    "title": "수정된 제목",
    "description": "수정된 설명",
    "start_date": "2024-12-05",
    "end_date": "2025-01-05"
  }
  ```
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "캘린더가 수정되었습니다",
      "calendar": {
        /* 수정된 캘린더 */
      }
    }
    ```

### 2-5. 캘린더 마감

캘린더의 투표를 마감합니다.

- **Endpoint**: `POST /calendars/:slug/close`
- **Auth**: Participant Token (Host 권한)
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "캘린더가 마감되었습니다",
      "calendar": { "is_closed": true }
    }
    ```

### 2-6. 캘린더 삭제

캘린더를 삭제합니다.

- **Endpoint**: `DELETE /calendars/:slug`
- **Auth**: Participant Token (Host 권한)
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "캘린더가 삭제되었습니다"
    }
    ```

---

## 3. 참가자 (Participant API)

특정 캘린더 모임에 참여하는 사람들을 관리합니다.

**Base Path**: `/calendars/:slug/participants`

### 3-1. 참가자 등록 (입장)

캘린더에 새로운 참가자로 등록합니다.

- **Endpoint**: `POST /calendars/:slug/participants`
- **Auth**:
  - 비회원: 불필요
  - 회원: User Token (선택)
- **Path Parameters**: `slug`
- **Request Body**:

  ```json
  {
    "nickname": "게스트닉네임",
    "password": "1234"
  }
  ```

  _회원은 password 생략 가능_

- **Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "message": "참가자 등록이 완료되었습니다",
      "participant": {
        "uuid": "participant-uuid-...",
        "nickname": "게스트닉네임",
        "role": "guest",
        "joined_at": "..."
      },
      "participantToken": "eyJhbG..."
    }
    ```

### 3-2. 참가자 로그인

기존에 등록한 참가자로 다시 로그인합니다.

- **Endpoint**: `POST /calendars/:slug/participants/login`
- **Auth**: 불필요 (또는 User Token)
- **Path Parameters**: `slug`
- **Request Body**:

  ```json
  {
    "nickname": "게스트닉네임",
    "password": "1234"
  }
  ```

  _회원은 Body 비움_

- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "로그인 성공",
      "participant": {
        /* 참가자 정보 */
      },
      "participantToken": "eyJhbG..."
    }
    ```

### 3-3. 참가자 목록 조회

해당 캘린더의 모든 참가자 목록과 투표 현황을 조회합니다.

- **Endpoint**: `GET /calendars/:slug/participants`
- **Auth**: 불필요
- **Path Parameters**: `slug`
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "participants": [
        {
          "uuid": "...",
          "nickname": "철수",
          "role": "host",
          "vote_count": 5,
          "total_dates": 10,
          "vote_rate": 50
        }
      ],
      "count": 2
    }
    ```

### 3-4. 참가자 삭제 (본인 퇴장)

참가자가 스스로 모임에서 나갑니다.

- **Endpoint**: `DELETE /calendars/:slug/participants/self`
- **Auth**: Participant Token
- **Path Parameters**: `slug`
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "참가자가 삭제되었습니다"
    }
    ```

### 3-5. 참가자 강퇴 (방장 전용)

방장이 특정 참가자를 내보냅니다.

- **Endpoint**: `DELETE /calendars/:slug/participants/:uuid`
- **Auth**: Participant Token (Host 권한)
- **Path Parameters**:
  - `slug`: 캘린더 ID
  - `uuid`: 삭제할 참가자 UUID
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "참가자가 삭제되었습니다"
    }
    ```

---

## 4. 투표 (Vote API)

날짜별 투표를 진행하고 현황을 조회합니다.

**Base Path**: `/calendars/:slug/votes`

### 4-1. 투표 제출/수정

참가자가 가능한 날짜들을 선택하여 제출합니다. (기존 투표 덮어쓰기)

- **Endpoint**: `POST /calendars/:slug/votes`
- **Auth**: Participant Token
- **Path Parameters**: `slug`
- **Request Body**:

  ```json
  {
    "selectedDates": ["2024-12-24", "2024-12-25"],
    "voteType": "available"
  }
  ```

  _voteType: 'available', 'unavailable', 'maybe' (기본값: available)_

- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "message": "투표가 제출되었습니다",
      "votedCount": 2,
      "selectedDates": ["2024-12-24", "2024-12-25"]
    }
    ```
- **Socket Event**: `voteUpdated` 이벤트가 해당 캘린더 룸의 모든 클라이언트에게 전송됩니다.

### 4-2. 투표 현황 조회 (그리드 뷰)

캘린더의 날짜별로 누가 투표했는지 전체 현황을 조회합니다.

- **Endpoint**: `GET /calendars/:slug/votes`
- **Auth**: 불필요
- **Path Parameters**: `slug`
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "calendar": {
        /* 캘린더 기본 정보 */
      },
      "voteStatus": [
        {
          "date_value": "2024-12-24T00:00:00.000Z",
          "is_enabled": true,
          "votes": [
            {
              "participant_nickname": "철수",
              "vote_type": "available"
            }
          ]
        }
      ]
    }
    ```

### 4-3. 특정 참가자 투표 내역 조회

특정 참가자가 어떤 날짜에 투표했는지 조회합니다.

- **Endpoint**: `GET /calendars/:slug/votes/:participantUuid`
- **Auth**: 불필요
- **Path Parameters**:
  - `slug`: 캘린더 ID
  - `participantUuid`: 조회할 참가자 UUID
- **Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "participant": {
        "nickname": "철수",
        "color_code": "#FF0000"
      },
      "votes": [
        {
          "date_value": "2024-12-24T00:00:00.000Z",
          "vote_type": "available"
        }
      ],
      "voteCount": 1
    }
    ```

---

## 5. 공공 데이터 Proxy API

### 공휴일 정보 조회

한국천문연구원 특일 정보 API를 중계하여 공휴일 정보를 반환합니다. (CORS 회피 및 API 키 보안)

- **Endpoint**: `GET /proxy/publicdata/holidays`
- **Auth**: 불필요
- **Query Parameters**:
  - `year` (YYYY)
  - `month` (MM)
- **Response**: 한국천문연구원 API 응답 그대로 중계

---

## 6. 실시간 통신 (Socket.IO)

Socket.IO를 사용하여 투표 현황 업데이트, 참가자 접속 상태, 캘린더 변경 사항을 실시간으로 동기화합니다.

### 연결 및 인증

- **Namespace**: `/` (기본)
- **Path**: `/socket.io/`
- **Auth Method**: Handshake 시 Participant Token 전달
  - `auth: { token: "YOUR_PARTICIPANT_TOKEN" }`
  - 또는 `Authorization: Bearer YOUR_PARTICIPANT_TOKEN` 헤더

#### 클라이언트 연결 예시

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: {
    token: "eyJhbGciOiJIUz...",
  },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});
```

### 클라이언트 → 서버 이벤트

#### joinCalendarRoom

캘린더 방에 입장합니다.

- **Event**: `joinCalendarRoom`
- **Payload**: 없음 (토큰 기반 자동 처리)
- **설명**: 입장 성공 시 `onlineUsers` 이벤트 수신, 다른 참가자들에게 `userOnline` 전송

#### leaveCalendarRoom

캘린더 방에서 퇴장합니다.

- **Event**: `leaveCalendarRoom`
- **Payload**: 없음
- **설명**: 다른 참가자들에게 `userOffline` 전송

### 서버 → 클라이언트 이벤트

#### onlineUsers

현재 접속자 목록 (입장 시 나에게만 전송)

- **Event**: `onlineUsers`
- **Payload**:
  ```json
  [
    {
      "sub": "participant-uuid-1",
      "nickname": "철수",
      "role": "host"
    }
  ]
  ```

#### userOnline

새로운 유저 입장 알림

- **Event**: `userOnline`
- **Payload**:
  ```json
  {
    "sub": "participant-uuid-new",
    "nickname": "새참가자",
    "role": "guest"
  }
  ```

#### userOffline

유저 퇴장 알림

- **Event**: `userOffline`
- **Payload**:
  ```json
  {
    "sub": "participant-uuid-left",
    "nickname": "나간사람"
  }
  ```

#### voteUpdated

투표 현황 업데이트

- **Event**: `voteUpdated`
- **Payload**:
  ```json
  {
    "calendarSlug": "Ab3dE9xR",
    "participantUuId": "participant-uuid-voter",
    "participantNickname": "투표한사람",
    "voteStatus": [
      /* GET /votes 응답과 동일한 배열 */
    ],
    "timestamp": "2024-12-01T10:00:00.000Z"
  }
  ```
- **팁**: `voteStatus`가 포함되어 있어 별도 API 호출 없이 화면 갱신 가능

#### calendarUpdated

캘린더 정보 수정됨

- **Event**: `calendarUpdated`
- **Payload**:
  ```json
  {
    "message": "캘린더 정보가 수정되었습니다.",
    "calendar": {
      /* SafeCalendar 객체 */
    }
  }
  ```

#### calendarClosed

캘린더 마감됨

- **Event**: `calendarClosed`
- **Payload**:
  ```json
  {
    "message": "투표가 마감되었습니다.",
    "isClosed": true
  }
  ```

#### calendarDeleted

캘린더 삭제됨 (연결 강제 종료)

- **Event**: `calendarDeleted`
- **Payload**:
  ```json
  {
    "message": "방장에 의해 캘린더가 삭제되었습니다."
  }
  ```
- **주의**: 이벤트 수신 직후 소켓 연결이 강제로 끊깁니다.

---

## 추가 참고사항

### 에러 처리

- 401 에러 발생 시 `/auth/refresh`를 호출하여 토큰 갱신
- `socket.on('error')` 핸들러로 소켓 인증 실패 처리

### 투표 현황 갱신 최적화

- `voteUpdated` 이벤트의 `voteStatus`를 활용하여 별도 API 호출 없이 UI 업데이트

### 토큰 저장 권장사항

- **Access/Refresh Token**: HttpOnly 쿠키 (자동 관리)
- **Participant Token**: localStorage 또는 메모리 변수
- **Signup Token**: 임시 변수 (회원가입 완료 시 폐기)
