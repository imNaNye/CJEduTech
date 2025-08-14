-- db/schema.sql
SET NAMES utf8mb4;
SET time_zone = '+09:00';

START TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(36) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    session_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role ENUM('admin','user','guest') NOT NULL DEFAULT 'user',
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS slides (
    slide_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id VARCHAR(255),
    slide_sequence INT,
    slide_text VARCHAR(255),
    audio_url VARCHAR(255),
    display_time INT,
    PRIMARY KEY (slide_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS quizzes (
    quiz_id VARCHAR(36) NOT NULL,
    round_id VARCHAR(36) NOT NULL,
    question TEXT NOT NULL,
    options JSON NOT NULL,
    correct_option VARCHAR(8) NOT NULL,
    explanation TEXT NULL,
    game_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (quiz_id),
    KEY ix_quizzes_round_id (round_id)
    -- 외래키를 사용할 경우, rounds 테이블이 먼저 생성되어 있어야 합니다.
    -- CONSTRAINT fk_quizzes_round
    --   FOREIGN KEY (round_id) REFERENCES rounds(round_id)
    --   ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS videos (
    video_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    video_url VARCHAR(2083) NOT NULL,
    duration INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (video_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS discussions (
    discussion_id VARCHAR(36) NOT NULL,
    video_id VARCHAR(36) NOT NULL,
    topic TEXT NOT NULL,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    PRIMARY KEY (discussion_id),
    KEY ix_discussions_video_id (video_id),
    CONSTRAINT fk_discussions_video
        FOREIGN KEY (video_id) REFERENCES videos(video_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
    message_id VARCHAR(36) NOT NULL,
    discussion_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tagged_trait ENUM('정직','열정','창의','존중','기타') NOT NULL,
    PRIMARY KEY (message_id),
    KEY ix_chat_messages_discussion_id (discussion_id),
    KEY ix_chat_messages_user_id (user_id),
    CONSTRAINT fk_chat_messages_discussion
        FOREIGN KEY (discussion_id) REFERENCES discussions(discussion_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
    -- user_id 외래키는 users 테이블이 정의되어 있어야 추가 가능
    -- CONSTRAINT fk_chat_messages_user
    --    FOREIGN KEY (user_id) REFERENCES users(user_id)
    --    ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(36) NOT NULL,
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    PRIMARY KEY (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reactions (
    reaction_id VARCHAR(36) NOT NULL,
    message_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    type ENUM('공감','좋아요','웃음','기타') NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (reaction_id),
    KEY ix_reactions_message_id (message_id),
    KEY ix_reactions_user_id (user_id),
    CONSTRAINT fk_reactions_message
        FOREIGN KEY (message_id) REFERENCES chat_messages(message_id)
        ON DELETE CASCADE ON UPDATE RESTRICT
    -- user_id 외래키는 users 테이블 생성 후 추가 가능
    -- CONSTRAINT fk_reactions_user
    --     FOREIGN KEY (user_id) REFERENCES users(user_id)
    --     ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS badges (
    badge_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    trait ENUM('정직','열정','창의','존중','기타') NOT NULL,
    awarded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (badge_id),
    KEY ix_badges_user_id (user_id)
    -- CONSTRAINT fk_badges_user
    --     FOREIGN KEY (user_id) REFERENCES users(user_id)
    --     ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS rounds (
    round_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    round_number INT NOT NULL,
    status ENUM('진행중','완료') NOT NULL DEFAULT '진행중',
    started_at TIMESTAMP NULL,
    ended_at TIMESTAMP NULL,
    PRIMARY KEY (round_id)
    -- session_id 외래키는 sessions 테이블 생성 후 추가 가능
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS dashboard_summaries (
    summary_id VARCHAR(36) NOT NULL,
    round_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    top_trait ENUM('정직','열정','창의','존중','기타') NOT NULL,
    most_reacted_user VARCHAR(36) NOT NULL,
    chat_count INT NOT NULL,
    summary_json JSON NOT NULL,
    PRIMARY KEY (summary_id),
    KEY ix_dashboard_summaries_round_id (round_id),
    KEY ix_dashboard_summaries_user_id (user_id)
    -- FOREIGN KEY 설정은 관련 테이블 생성 후 추가 가능
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS overall_summaries (
    overall_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    total_rounds INT NOT NULL,
    overall_trait ENUM('정직','열정','창의','존중','기타') NOT NULL,
    growth_score FLOAT NOT NULL,
    total_data_json JSON NOT NULL,
    PRIMARY KEY (overall_id),
    KEY ix_overall_summaries_session_id (session_id),
    KEY ix_overall_summaries_user_id (user_id)
    -- FOREIGN KEY 설정은 관련 테이블 생성 후 추가 가능
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===== Add Foreign Keys after table creation =====
-- quizzes.round_id -> rounds.round_id
ALTER TABLE quizzes
  ADD CONSTRAINT fk_quizzes_round
    FOREIGN KEY (round_id) REFERENCES rounds(round_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

-- chat_messages.user_id -> users.user_id
ALTER TABLE chat_messages
  ADD CONSTRAINT fk_chat_messages_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

-- reactions.user_id -> users.user_id
ALTER TABLE reactions
  ADD CONSTRAINT fk_reactions_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

-- badges.user_id -> users.user_id
ALTER TABLE badges
  ADD CONSTRAINT fk_badges_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

-- dashboard_summaries.round_id -> rounds.round_id
ALTER TABLE dashboard_summaries
  ADD CONSTRAINT fk_dashboard_summaries_round
    FOREIGN KEY (round_id) REFERENCES rounds(round_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

-- dashboard_summaries.user_id -> users.user_id
ALTER TABLE dashboard_summaries
  ADD CONSTRAINT fk_dashboard_summaries_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

-- overall_summaries.user_id -> users.user_id
ALTER TABLE overall_summaries
  ADD CONSTRAINT fk_overall_summaries_user
    FOREIGN KEY (user_id) REFERENCES users(user_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

ALTER TABLE rounds
  ADD CONSTRAINT fk_rounds_session
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    ON DELETE CASCADE ON UPDATE RESTRICT;

COMMIT;