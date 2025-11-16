-- Members table
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  number INTEGER NOT NULL,
  role VARCHAR(100) NOT NULL,
  name VARCHAR(100) NOT NULL,
  show_in_koubanhyou BOOLEAN DEFAULT true,
  show_in_schedule BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs table
CREATE TABLE songs (
  id SERIAL PRIMARY KEY,
  ba VARCHAR(50) NOT NULL,
  song_number VARCHAR(50) NOT NULL,
  song_name VARCHAR(200) NOT NULL,
  score_link TEXT,
  audio_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Koubanhyou (Member-Song matrix)
CREATE TABLE koubanhyou (
  id SERIAL PRIMARY KEY,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
  is_assigned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(member_id, song_id)
);

-- Schedules table
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  schedule_date DATE NOT NULL,
  venue VARCHAR(200),
  start_time TIME,
  end_time TIME,
  rehearsal_type VARCHAR(100),
  rehearsal_content TEXT,
  target_songs INTEGER[],
  target_roles VARCHAR(100)[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedule Attendance
CREATE TABLE schedule_attendance (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER REFERENCES schedules(id) ON DELETE CASCADE,
  member_id INTEGER REFERENCES members(id) ON DELETE CASCADE,
  attendance_status VARCHAR(10) CHECK (attendance_status IN ('○', '△', '×', 'text')),
  custom_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(schedule_id, member_id)
);

-- Indexes for better query performance
CREATE INDEX idx_koubanhyou_member ON koubanhyou(member_id);
CREATE INDEX idx_koubanhyou_song ON koubanhyou(song_id);
CREATE INDEX idx_schedule_attendance_schedule ON schedule_attendance(schedule_id);
CREATE INDEX idx_schedule_attendance_member ON schedule_attendance(member_id);
CREATE INDEX idx_schedules_date ON schedules(schedule_date);
