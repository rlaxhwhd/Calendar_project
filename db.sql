CREATE TABLE calendars (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(32) NOT NULL UNIQUE, /*랜덤 토큰 url*/
    owner_token VARCHAR(64) NOT NULL, /*생성자 토큰*/
    title VARCHAR(100) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, /*생성일*/
    expires_at DATETIME NULL,
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 참여자 테이블
CREATE TABLE members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    calendar_id BIGINT NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    member_token VARCHAR(64) NOT NULL UNIQUE, /*재접속해도 로그인? 유지되게 로컬스토리지에 저장해야됨*/
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_members_calendar FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    UNIQUE KEY uq_member_nickname (calendar_id, nickname)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 날짜 테이블
CREATE TABLE dates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    calendar_id BIGINT NOT NULL,
    date DATE NOT NULL,
    CONSTRAINT fk_dates_calendar FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 날짜선택투표 테이블
CREATE TABLE votes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_id BIGINT NOT NULL,
    date_id BIGINT NOT NULL,
    vote_bool TINYINT(1) NOT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_votes_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    CONSTRAINT fk_votes_date FOREIGN KEY (date_id) REFERENCES dates(id) ON DELETE CASCADE,
    UNIQUE KEY uq_vote (member_id, date_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 접속 상태 테이블 (Presence)
CREATE TABLE presence (
    calendar_id BIGINT NOT NULL,
    member_id BIGINT NOT NULL,
    last_ping DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (calendar_id, member_id),
    CONSTRAINT fk_presence_calendar FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    CONSTRAINT fk_presence_member FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;