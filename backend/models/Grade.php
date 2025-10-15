<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/connection.php';

class GradeModel {
    public function __construct(private PDO $pdo) {}

    public static function withDefaultConnection(): self {
        $db = new DatabaseConnection();
        return new self($db->pdo());
    }

    public function all(): array {
        $stmt = $this->pdo->query('
            SELECT g.*, 
                   s.first_name, s.last_name, s.student_id,
                   sub.subject_code, sub.subject_name
            FROM student_grades g
            LEFT JOIN students s ON g.student_id = s.id
            LEFT JOIN subjects sub ON g.subject_id = sub.id
            ORDER BY g.created_at DESC
        ');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->pdo->prepare('
            SELECT g.*, 
                   s.first_name, s.last_name, s.student_id,
                   sub.subject_code, sub.subject_name
            FROM student_grades g
            LEFT JOIN students s ON g.student_id = s.id
            LEFT JOIN subjects sub ON g.subject_id = sub.id
            WHERE g.id = ?
        ');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findByStudent(int $studentId): array {
        $stmt = $this->pdo->prepare('
            SELECT g.*, 
                   s.first_name, s.last_name, s.student_id,
                   sub.subject_code, sub.subject_name
            FROM student_grades g
            LEFT JOIN students s ON g.student_id = s.id
            LEFT JOIN subjects sub ON g.subject_id = sub.id
            WHERE g.student_id = ?
            ORDER BY g.academic_year DESC, g.semester DESC
        ');
        $stmt->execute([$studentId]);
        return $stmt->fetchAll();
    }

    public function findBySubject(int $subjectId): array {
        $stmt = $this->pdo->prepare('
            SELECT g.*, 
                   s.first_name, s.last_name, s.student_id,
                   sub.subject_code, sub.subject_name
            FROM student_grades g
            LEFT JOIN students s ON g.student_id = s.id
            LEFT JOIN subjects sub ON g.subject_id = sub.id
            WHERE g.subject_id = ?
            ORDER BY g.final_rating DESC
        ');
        $stmt->execute([$subjectId]);
        return $stmt->fetchAll();
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO student_grades (student_id, subject_id, academic_year, semester, 
                                      midterm_grade, final_grade, final_rating, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ');
        $stmt->execute([
            $data['student_id'] ?? null,
            $data['subject_id'] ?? null,
            $data['academic_year'] ?? date('Y') . '-' . (date('Y') + 1),
            $data['semester'] ?? '1st',
            $data['midterm_grade'] ?? null,
            $data['final_grade'] ?? null,
            $data['final_rating'] ?? null,
            $data['status'] ?? 'Failed',
        ]);
        return intval($this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        if (isset($data['student_id'])) {
            $fields[] = 'student_id = ?';
            $values[] = $data['student_id'];
        }
        if (isset($data['subject_id'])) {
            $fields[] = 'subject_id = ?';
            $values[] = $data['subject_id'];
        }
        if (isset($data['academic_year'])) {
            $fields[] = 'academic_year = ?';
            $values[] = $data['academic_year'];
        }
        if (isset($data['semester'])) {
            $fields[] = 'semester = ?';
            $values[] = $data['semester'];
        }
        if (isset($data['midterm_grade'])) {
            $fields[] = 'midterm_grade = ?';
            $values[] = $data['midterm_grade'];
        }
        if (isset($data['final_grade'])) {
            $fields[] = 'final_grade = ?';
            $values[] = $data['final_grade'];
        }
        if (isset($data['final_rating'])) {
            $fields[] = 'final_rating = ?';
            $values[] = $data['final_rating'];
        }
        if (isset($data['status'])) {
            $fields[] = 'status = ?';
            $values[] = $data['status'];
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = 'UPDATE student_grades SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare('DELETE FROM student_grades WHERE id = ?');
        return $stmt->execute([$id]);
    }
}





