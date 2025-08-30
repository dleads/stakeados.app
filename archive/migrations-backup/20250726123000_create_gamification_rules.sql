CREATE TABLE gamification_rules (
  activity_type TEXT PRIMARY KEY,
  points INTEGER NOT NULL,
  description TEXT
);

INSERT INTO gamification_rules (activity_type, points, description) VALUES
-- Profile & Login
('COMPLETE_PROFILE', 5, 'Complete your user profile'),
('DAILY_LOGIN', 1, 'Log in to the platform'),

-- Course Completion
('COMPLETE_BASIC_COURSE', 5, 'Complete a basic course'),
('COMPLETE_INTERMEDIATE_COURSE', 10, 'Complete an intermediate course'),
('COMPLETE_ADVANCED_COURSE', 15, 'Complete an advanced course'),

-- Other Learning Activities
('COURSE_START', 2, 'Start a new course'),
('QUIZ_PERFECT', 5, 'Get a perfect score on a quiz'),
('STREAK_MILESTONE', 1, 'Point per day in a learning streak'),

-- Community & Contribution
('DISCUSSION_PARTICIPATE', 2, 'Participate in a discussion'),
('WRITE_APPROVED_ARTICLE', 15, 'Write an approved article'),
('WRITE_FEATURED_ARTICLE', 25, 'Have an article featured'),
('WRITE_HIGH_QUALITY_ARTICLE', 20, 'Write a high-quality, in-depth article');
