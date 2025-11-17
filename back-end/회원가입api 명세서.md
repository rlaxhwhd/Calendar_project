# Auth API 명세서 (v1.0)

본 문서는 프로젝트의 사용자 인증(Google OAuth) 및 세션 관리에 필요한 API 엔드포인트를 정의합니다.

**Base URL:** `/api/v1`

---

## 1. Google 로그인 시작

사용자를 Google OAuth 2.0 인증 페이지로 리디렉션합니다.

### Endpoint

```
GET /auth/google
```

### Method

`GET`

### Description

프론트엔드에서 이 엔드포인트로 페이지 이동(`<a>` 태그, `window.location.href`)을 요청하면, 백엔드는 사용자를 Google 로그인 페이지로 302 Redirect시킵니다.

### Success Response

**Status:** `302 Found`

**Location:** Google OAuth 인증 URL

---

## 2. Google OAuth 콜백

Google 로그인이 성공하면, Google이 사용자를 이 엔드포인트로 리디렉션합니다. (인증 코드 포함)  
백엔드는 이 코드를 받아 신규 사용자인지 기존 사용자인지 판별합니다.

### Endpoint

```
GET /auth/google/callback
```

### Method

`GET`

### Request Query Parameters

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `code`    | string | ✅       | Google이 발급한 일회성 인증 코드 |

### Success Response

**Status:** `200 OK`

이 엔드포인트는 사용자에 따라 **두 가지 다른 형태의 JSON을 반환**합니다.  
**반드시 `isNewUser` 필드로 분기 처리해야 합니다.**

#### A. 기존 사용자 (즉시 로그인 성공)

**Description:**  
로그인에 성공했으며, RefreshToken은 응답과 동시에 `jwt` 이름의 httpOnly 쿠키로 자동 설정됩니다.

**Response Body (ExistingUserResponse):**

```json
{
  "isNewUser": false,
  "message": "로그인 성공",
  "accessToken": "string (JWT Access Token)",
  "user": {
    "user_uuid": "string (User's UUID)",
    "email": "string",
    "nickname": "string",
    "profile_image_url": "string"
  }
}
```

**프론트엔드 작업:**  
`accessToken`과 `user` 정보를 클라이언트 상태(State)에 저장하고, 메인 페이지로 이동시킵니다.

#### B. 신규 사용자 (회원가입 필요)

**Description:**  
신규 사용자입니다. 백엔드는 회원가입을 마무리하기 위한 임시 토큰을 발급합니다.

**Response Body (NewUserResponse):**

```json
{
  "isNewUser": true,
  "message": "신규 사용자입니다. 회원가입을 진행해주세요.",
  "token": "string (JWT Signup Token)"
}
```

**프론트엔드 작업:**  
`token`(임시 토큰)을 저장하고, 사용자를 회원가입 마무리 페이지(예: `/signup` 또는 약관 동의 페이지)로 이동시킵니다.

### Error Responses

| Status                      | Description                 |
| --------------------------- | --------------------------- |
| `401 Unauthorized`          | Google 인증에 실패했습니다. |
| `500 Internal Server Error` | 서버 내부 오류.             |

---

## 3. 신규 사용자 최종 회원가입

`/callback`에서 받은 임시 토큰과 추가 정보(약관 동의 등)로 최종 회원가입을 완료합니다. 성공 시 즉시 로그인됩니다.

### Endpoint

```
POST /auth/register
```

### Method

`POST`

### Request Body

```json
{
  "token": "string (Callback에서 받은 임시 Signup Token)",
  "isTermsAgreed": true
}
```

### Success Response

**Status:** `201 Created`

**Description:**  
회원가입과 로그인에 모두 성공했습니다. RefreshToken은 응답과 동시에 `jwt` 이름의 httpOnly 쿠키로 자동 설정됩니다.

**Response Body:**

```json
{
  "message": "회원가입 및 로그인 성공",
  "accessToken": "string (JWT Access Token)",
  "user": {
    "user_uuid": "string (User's UUID)",
    "email": "string",
    "nickname": "string",
    "profile_image_url": "string"
  }
}
```

### Error Responses

| Status             | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `400 Bad Request`  | 약관에 동의하지 않았습니다. (`isTermsAgreed: false`) |
| `401 Unauthorized` | 임시 토큰이 만료되었거나 유효하지 않습니다.          |

---

## 4. Access Token 갱신

AccessToken이 만료되었을 때, 쿠키의 RefreshToken을 사용하여 새로운 AccessToken을 발급받습니다. (Axios 인터셉터 구현을 권장합니다.)

### Endpoint

```
POST /auth/refresh
```

### Method

`POST`

### Request

- **Request Body는 비어있어야 합니다.**
- 브라우저는 `jwt` 이름의 httpOnly 쿠키(RefreshToken)를 **반드시 포함**하여 요청해야 합니다.

### Success Response

**Status:** `200 OK`

**Description:**  
갱신에 성공했습니다. 새로운 RefreshToken이 다시 `jwt` 쿠키로 덮어씌워지고 (Token Rotation), 새로운 AccessToken이 본문으로 전달됩니다.

**Response Body:**

```json
{
  "message": "토큰 갱신 성공",
  "accessToken": "string (새로운 JWT Access Token)"
}
```

### Error Responses

| Status             | Description                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------- |
| `401 Unauthorized` | RefreshToken 쿠키가 없거나, 만료되었거나, 무효화 되었습니다. (이 경우 강제 로그아웃 처리 필요) |

---

## 5. 로그아웃

현재 세션을 파기합니다. (Redis에 저장된 토큰 파기 및 쿠키 삭제)

### Endpoint

```
POST /auth/logout
```

### Method

`POST`

### Request

- **Request Body는 비어있어야 합니다.**
- 브라우저는 `jwt` 이름의 httpOnly 쿠키(RefreshToken)를 **반드시 포함**하여 요청해야 합니다.

### Success Response

**Status:** `200 OK`

**Description:**  
로그아웃에 성공했으며, `jwt` 쿠키가 삭제되었습니다.

**Response Body:**

```json
{
  "message": "로그아웃 성공"
}
```

### Error Responses

| Status             | Description                                         |
| ------------------ | --------------------------------------------------- |
| `401 Unauthorized` | 이미 로그아웃 상태이거나, 유효하지 않은 토큰입니다. |
