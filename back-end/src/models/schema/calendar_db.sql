
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_uuid CHAR(36) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    oauth_provider ENUM('google', 'kakao') NOT NULL,
    oauth_id VARCHAR(255) NOT NULL,  -- OAuth 제공자의 고유 ID
    nickname VARCHAR(50),
    profile_image_url VARCHAR(500),
    isTermsAgreed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_oauth (oauth_provider, oauth_id),
    INDEX idx_email (email),
    INDEX idx_oauth (oauth_provider, oauth_id)
);

-- 2. 캘린더 테이블 (메인)
CREATE TABLE calendars (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(16) NOT NULL UNIQUE,  -- 랜덤 토큰 (예: Ab3dE9xR)
    title VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id BIGINT NOT NULL,  -- users 테이블 참조로 변경
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_owner_id (owner_id),
    INDEX idx_created_at (created_at)
);

-- 3. 참가자 테이블 (닉네임 기반 식별, 비회원)
CREATE TABLE participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    participant_uuid CHAR(36) NOT NULL UNIQUE,
    calendar_id BIGINT NOT NULL,
    nickname VARCHAR(20) NOT NULL,
    color_code VARCHAR(7) NOT NULL,  -- hex 색상 (애플리케이션에서 자동 할당)
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    INDEX idx_calendar_id (calendar_id),
    INDEX idx_calendar_nickname (calendar_id, nickname)
);

-- 4. 날짜 옵션 테이블 (투표 대상 날짜들)
CREATE TABLE date_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    date_value DATE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,  -- false: 투표 마감된 날짜 (UI에서 비활성화)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    UNIQUE KEY unique_date_per_calendar (calendar_id, date_value),
    INDEX idx_calendar_date (calendar_id, date_value)
);

-- 5. 투표 테이블
CREATE TABLE votes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    participant_id BIGINT NOT NULL,
    date_option_id BIGINT NOT NULL,
    vote_type ENUM('available', 'unavailable', 'maybe') NOT NULL,  -- DEFAULT 제거 (명시적 지정 강제)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (date_option_id) REFERENCES date_options(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote_per_user_date (participant_id, date_option_id),
    INDEX idx_date_option (date_option_id),
    INDEX idx_participant (participant_id)
);
