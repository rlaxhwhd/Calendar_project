CREATE TABLE members (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    calendar_id BIGINT NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, /*들어온 시간인데 이건 정렬용으로 필요할거같아서*/
    CONSTRAINT fk_members_calendar FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    UNIQUE KEY uq_calendar_nickname (calendar_id, nickname)
) 