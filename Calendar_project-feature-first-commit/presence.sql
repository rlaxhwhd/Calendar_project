/*예비용 선택이긴 함*/
CREATE TABLE presence (
    calendar_id BIGINT NOT NULL,
    members_id BIGINT NOT NULL,
    last_ping DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (calendar_id, members_id),
    CONSTRAINT fk_presence_calendar FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    CONSTRAINT fk_presence_members FOREIGN KEY (members_id) REFERENCES members(id) ON DELETE CASCADE
)