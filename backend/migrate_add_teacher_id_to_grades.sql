-- Migration script to add teacher_id field to student_grades table
-- This will allow us to track which teacher taught each grade

USE school_db;

-- Add teacher_id column to student_grades table
ALTER TABLE student_grades 
ADD COLUMN teacher_id INT AFTER subject_id,
ADD INDEX idx_teacher_id (teacher_id),
ADD CONSTRAINT fk_student_grades_teacher 
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;

-- Update existing records by matching teacher names
-- This is a temporary solution - ideally we'd have better data to match
UPDATE student_grades sg
SET teacher_id = (
    SELECT t.id 
    FROM teachers t 
    WHERE CONCAT(t.first_name, ' ', t.last_name) LIKE '%' 
    LIMIT 1
)
WHERE teacher_id IS NULL;

-- Add a note about the migration
INSERT INTO teachers (teacher_id, first_name, last_name, department, status, notes)
VALUES ('MIGRATION', 'System', 'Migration', 'System', 'Inactive', 'Migration record for teacher_id field addition')
ON DUPLICATE KEY UPDATE notes = CONCAT(notes, ' - Migration completed');

