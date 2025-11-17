# 프로젝트 폴더 구조 📁

## `web.ts`
- 서버 시작 파일
- Express 앱 생성, DB/Redis 연결, 라우트 등록
- `app.listen()`으로 서버 실행하는 진입점

---

## `routes/`
- URL 경로와 Controller 매핑
- HTTP 메서드(GET, POST) + 경로 정의
- 라우팅 설정을 모아두는 폴더

---

## `controllers/`
- HTTP 요청/응답 처리
- `req.body` 추출, Service 호출, `res.json()` 응답
- HTTP 계층을 담당하는 코드들을 모아두는 폴더

---

## `services/`
- 비즈니스 로직 처리
- 검증, 계산, 여러 Repository 조합, 트랜잭션 관리
- 핵심 비즈니스 규칙을 담당하는 코드들을 모아두는 폴더

---

## `repositories/`
- 데이터베이스 CRUD 전용
- SQL 쿼리 작성/실행, DB 결과를 객체로 변환
- DB 접근 로직을 담당하는 코드들을 모아두는 폴더

---

## `models/`
- DB 테이블 스키마 정의
- `CREATE TABLE` 문, Sequelize/TypeORM 모델, 테이블 관계 설정
- 데이터 구조를 정의하는 코드들을 모아두는 폴더

---

## `middlewares/`
- 요청 전처리
- 인증(JWT), 검증(Joi), 에러처리, 로깅
- Controller 실행 전 공통 처리를 담당하는 코드들을 모아두는 폴더

---

## `sockets/`
- WebSocket 실시간 통신
- Socket.IO 이벤트 핸들러, 접속 상태 관리, 실시간 투표 반영
- 실시간 기능을 담당하는 코드들을 모아두는 폴더

---

## `utils/`
- 공통 헬퍼 함수
- 토큰 생성, 날짜 포맷, 에러 클래스, 유틸리티
- 재사용 가능한 도구 함수들을 모아두는 폴더

---

## `config/`
- 환경 설정
- DB 연결 설정, Redis 설정, 상수 정의
- 프로젝트 설정 파일들을 모아두는 폴더
