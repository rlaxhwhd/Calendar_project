-- 1. 캘린더 테이블 (메인)
CREATE TABLE calendars (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    slug VARCHAR(16) NOT NULL UNIQUE,  -- 랜덤 토큰 (예: Ab3dE9xR)
    title VARCHAR(100) NOT NULL DEFAULT '일정 조율',
    description TEXT,
    owner_token VARCHAR(64) NOT NULL,  -- 생성자 식별용 (쿠키/세션)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_participants INT DEFAULT 50,   -- 최대 참가자 수
    is_active BOOLEAN DEFAULT TRUE
    
    INDEX idx_slug (slug),
    INDEX idx_owner_token (owner_token),
    INDEX idx_created_at (created_at)
);

-- 2. 참가자 테이블 (닉네임 기반 식별)
CREATE TABLE participants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    nickname VARCHAR(20) NOT NULL,
    color_code VARCHAR(7) DEFAULT '#3B82F6',  -- hex 색상 (자동 할당)
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_online BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    UNIQUE KEY unique_nickname_per_calendar (calendar_id, nickname),
    INDEX idx_calendar_id (calendar_id),
    INDEX idx_calendar_nickname (calendar_id, nickname),  -- 닉네임 조회 최적화
    INDEX idx_last_seen (last_seen)
);

-- 3. 날짜 옵션 테이블 (투표 대상 날짜들)
CREATE TABLE date_options (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    date_value DATE NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    UNIQUE KEY unique_date_per_calendar (calendar_id, date_value),
    INDEX idx_calendar_date (calendar_id, date_value)
);

-- 4. 투표 테이블
CREATE TABLE votes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    participant_id BIGINT NOT NULL,
    date_option_id BIGINT NOT NULL,
    vote_type ENUM('available', 'unavailable', 'maybe') DEFAULT 'unavailable',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (date_option_id) REFERENCES date_options(id) ON DELETE CASCADE,
    UNIQUE KEY unique_vote_per_user_date (participant_id, date_option_id),
    INDEX idx_date_option (date_option_id),
    INDEX idx_participant (participant_id)
);

-- 5. 투표 집계 캐시 테이블 (성능 최적화)
CREATE TABLE vote_summary (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    date_option_id BIGINT NOT NULL,
    total_participants INT DEFAULT 0,
    unavailable_count INT DEFAULT 0,
    available_count INT DEFAULT 0,
    maybe_count INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (date_option_id) REFERENCES date_options(id) ON DELETE CASCADE,
    UNIQUE KEY unique_summary_per_date (date_option_id),
    INDEX idx_date_option (date_option_id)
);

-- 6. 실시간 접속 상태 (선택적 - Redis로 대체 가능)
CREATE TABLE presence_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    calendar_id BIGINT NOT NULL,
    participant_id BIGINT NOT NULL,
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    connection_count INT DEFAULT 1,    -- 멀티 디바이스 접속 수
    
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    UNIQUE KEY unique_presence (calendar_id, participant_id),
    INDEX idx_last_ping (last_ping)
);

-- 트리거: 투표 변경시 자동으로 집계 테이블 업데이트
DELIMITER $$

CREATE TRIGGER update_vote_summary_after_insert
AFTER INSERT ON votes
FOR EACH ROW
BEGIN
    INSERT INTO vote_summary (date_option_id, total_participants, unavailable_count, available_count, maybe_count)
    SELECT 
        NEW.date_option_id,
        COUNT(DISTINCT p.id) as total_participants,
        SUM(CASE WHEN v.vote_type = 'unavailable' THEN 1 ELSE 0 END) as unavailable_count,
        SUM(CASE WHEN v.vote_type = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN v.vote_type = 'maybe' THEN 1 ELSE 0 END) as maybe_count
    FROM date_options d
    JOIN participants p ON p.calendar_id = d.calendar_id
    LEFT JOIN votes v ON v.participant_id = p.id AND v.date_option_id = d.id
    WHERE d.id = NEW.date_option_id
    ON DUPLICATE KEY UPDATE
        total_participants = VALUES(total_participants),
        unavailable_count = VALUES(unavailable_count),
        available_count = VALUES(available_count),
        maybe_count = VALUES(maybe_count),
        updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_vote_summary_after_update
AFTER UPDATE ON votes
FOR EACH ROW
BEGIN
    INSERT INTO vote_summary (date_option_id, total_participants, unavailable_count, available_count, maybe_count)
    SELECT 
        NEW.date_option_id,
        COUNT(DISTINCT p.id) as total_participants,
        SUM(CASE WHEN v.vote_type = 'unavailable' THEN 1 ELSE 0 END) as unavailable_count,
        SUM(CASE WHEN v.vote_type = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN v.vote_type = 'maybe' THEN 1 ELSE 0 END) as maybe_count
    FROM date_options d
    JOIN participants p ON p.calendar_id = d.calendar_id
    LEFT JOIN votes v ON v.participant_id = p.id AND v.date_option_id = d.id
    WHERE d.id = NEW.date_option_id
    ON DUPLICATE KEY UPDATE
        total_participants = VALUES(total_participants),
        unavailable_count = VALUES(unavailable_count),
        available_count = VALUES(available_count),
        maybe_count = VALUES(maybe_count),
        updated_at = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER update_vote_summary_after_delete
AFTER DELETE ON votes
FOR EACH ROW
BEGIN
    INSERT INTO vote_summary (date_option_id, total_participants, unavailable_count, available_count, maybe_count)
    SELECT 
        OLD.date_option_id,
        COUNT(DISTINCT p.id) as total_participants,
        SUM(CASE WHEN v.vote_type = 'unavailable' THEN 1 ELSE 0 END) as unavailable_count,
        SUM(CASE WHEN v.vote_type = 'available' THEN 1 ELSE 0 END) as available_count,
        SUM(CASE WHEN v.vote_type = 'maybe' THEN 1 ELSE 0 END) as maybe_count
    FROM date_options d
    JOIN participants p ON p.calendar_id = d.calendar_id
    LEFT JOIN votes v ON v.participant_id = p.id AND v.date_option_id = d.id
    WHERE d.id = OLD.date_option_id
    ON DUPLICATE KEY UPDATE
        total_participants = VALUES(total_participants),
        unavailable_count = VALUES(unavailable_count),
        available_count = VALUES(available_count),
        maybe_count = VALUES(maybe_count),
        updated_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- 자주 사용될 쿼리들 (예시)
-- 1. 캘린더 생성
-- INSERT INTO calendars (slug, title, owner_token) VALUES (?, ?, ?);

-- 2. 참가자 등록 (닉네임 중복 체크 - DB 레벨에서 자동 처리)
-- INSERT INTO participants (calendar_id, nickname, color_code) VALUES (?, ?, ?);
-- 에러 발생시: Duplicate entry 'calendar_id-nickname' for key 'unique_nickname_per_calendar'

-- 3. 닉네임으로 참가자 ID 조회
-- SELECT id FROM participants WHERE calendar_id = ? AND nickname = ?;

-- 4. 투표하기 (토글 방식)
-- INSERT INTO votes (participant_id, date_option_id, vote_type) VALUES (?, ?, ?)
-- ON DUPLICATE KEY UPDATE vote_type = VALUES(vote_type), updated_at = CURRENT_TIMESTAMP;

-- 5. 특정 캘린더의 투표 현황 조회
-- SELECT d.date_value, vs.total_participants, vs.unavailable_count, vs.available_count
-- FROM date_options d
-- LEFT JOIN vote_summary vs ON vs.date_option_id = d.id
-- WHERE d.calendar_id = ? ORDER BY d.date_value;

-- 6. 참가자 온라인 상태 업데이트 (닉네임 기반)
-- UPDATE participants SET last_seen = CURRENT_TIMESTAMP, is_online = TRUE 
-- WHERE calendar_id = ? AND nickname = ?;

-- 7. 캘린더 참가자 목록 조회
-- SELECT nickname, color_code, is_online, last_seen 
-- FROM participants 
-- WHERE calendar_id = ? 
-- ORDER BY joined_at;








