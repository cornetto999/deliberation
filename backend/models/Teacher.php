<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/connection.php';

class TeacherModel {
    public function __construct(private PDO $pdo) {}

    public static function withDefaultConnection(): self {
        $db = new DatabaseConnection();
        return new self($db->pdo());
    }

    public function all(): array {
        $stmt = $this->pdo->query('
            SELECT t.*
            FROM teachers t 
            ORDER BY t.created_at DESC
        ');
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array {
        $stmt = $this->pdo->prepare('
            SELECT t.*
            FROM teachers t 
            WHERE t.id = ?
        ');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function create(array $data): int {
        $stmt = $this->pdo->prepare('
            INSERT INTO teachers (teacher_id, first_name, last_name, middle_name, email, 
                                department, position, status, zone, notes, enrolled_students,
                                failed_students, failure_percentage,
                                p1_failed, p1_percent, p1_category, p2_failed, p2_percent, p2_category,
                                p3_failed, p3_percent, p3_category) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                first_name = VALUES(first_name),
                last_name = VALUES(last_name),
                middle_name = VALUES(middle_name),
                email = VALUES(email),
                department = VALUES(department),
                position = VALUES(position),
                status = VALUES(status),
                zone = VALUES(zone),
                notes = VALUES(notes),
                enrolled_students = VALUES(enrolled_students),
                failed_students = VALUES(failed_students),
                failure_percentage = VALUES(failure_percentage),
                p1_failed = VALUES(p1_failed),
                p1_percent = VALUES(p1_percent),
                p1_category = VALUES(p1_category),
                p2_failed = VALUES(p2_failed),
                p2_percent = VALUES(p2_percent),
                p2_category = VALUES(p2_category),
                p3_failed = VALUES(p3_failed),
                p3_percent = VALUES(p3_percent),
                p3_category = VALUES(p3_category),
                updated_at = CURRENT_TIMESTAMP
        ');
        $stmt->execute([
            $data['teacher_id'] ?? '',
            $data['first_name'] ?? '',
            $data['last_name'] ?? '',
            $data['middle_name'] ?? null,
            $data['email'] ?? null,
            $data['department'] ?? '',
            $data['position'] ?? null,
            $data['status'] ?? 'Active',
            $data['zone'] ?? 'green',
            $data['notes'] ?? null,
            $data['enrolled_students'] ?? 0,
            $data['failed_students'] ?? 0,
            $data['failure_percentage'] ?? 0.00,
            $data['p1_failed'] ?? 0,
            $data['p1_percent'] ?? 0.00,
            $data['p1_category'] ?? 'GREEN (0.01%-10%)',
            $data['p2_failed'] ?? 0,
            $data['p2_percent'] ?? 0.00,
            $data['p2_category'] ?? 'GREEN (0.01%-10%)',
            $data['p3_failed'] ?? 0,
            $data['p3_percent'] ?? 0.00,
            $data['p3_category'] ?? 'GREEN (0.01%-10%)',
        ]);
        return intval($this->pdo->lastInsertId());
    }

    public function update(int $id, array $data): bool {
        $fields = [];
        $values = [];
        
        if (isset($data['teacher_id'])) {
            $fields[] = 'teacher_id = ?';
            $values[] = $data['teacher_id'];
        }
        if (isset($data['first_name'])) {
            $fields[] = 'first_name = ?';
            $values[] = $data['first_name'];
        }
        if (isset($data['last_name'])) {
            $fields[] = 'last_name = ?';
            $values[] = $data['last_name'];
        }
        if (isset($data['middle_name'])) {
            $fields[] = 'middle_name = ?';
            $values[] = $data['middle_name'];
        }
        if (isset($data['email'])) {
            $fields[] = 'email = ?';
            $values[] = $data['email'];
        }
        if (isset($data['department'])) {
            $fields[] = 'department = ?';
            $values[] = $data['department'];
        }
        if (isset($data['position'])) {
            $fields[] = 'position = ?';
            $values[] = $data['position'];
        }
        if (isset($data['status'])) {
            $fields[] = 'status = ?';
            $values[] = $data['status'];
        }
        if (isset($data['zone'])) {
            $fields[] = 'zone = ?';
            $values[] = $data['zone'];
        }
        if (isset($data['notes'])) {
            $fields[] = 'notes = ?';
            $values[] = $data['notes'];
        }
        if (isset($data['enrolled_students'])) {
            $fields[] = 'enrolled_students = ?';
            $values[] = $data['enrolled_students'];
        }
        if (isset($data['failed_students'])) {
            $fields[] = 'failed_students = ?';
            $values[] = $data['failed_students'];
        }
        if (isset($data['failure_percentage'])) {
            $fields[] = 'failure_percentage = ?';
            $values[] = $data['failure_percentage'];
        }
        if (isset($data['p1_failed'])) {
            $fields[] = 'p1_failed = ?';
            $values[] = $data['p1_failed'];
        }
        if (isset($data['p1_percent'])) {
            $fields[] = 'p1_percent = ?';
            $values[] = $data['p1_percent'];
        }
        if (isset($data['p1_category'])) {
            $fields[] = 'p1_category = ?';
            $values[] = $data['p1_category'];
        }
        if (isset($data['p2_failed'])) {
            $fields[] = 'p2_failed = ?';
            $values[] = $data['p2_failed'];
        }
        if (isset($data['p2_percent'])) {
            $fields[] = 'p2_percent = ?';
            $values[] = $data['p2_percent'];
        }
        if (isset($data['p2_category'])) {
            $fields[] = 'p2_category = ?';
            $values[] = $data['p2_category'];
        }
        if (isset($data['p3_failed'])) {
            $fields[] = 'p3_failed = ?';
            $values[] = $data['p3_failed'];
        }
        if (isset($data['p3_percent'])) {
            $fields[] = 'p3_percent = ?';
            $values[] = $data['p3_percent'];
        }
        if (isset($data['p3_category'])) {
            $fields[] = 'p3_category = ?';
            $values[] = $data['p3_category'];
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $values[] = $id;
        $sql = 'UPDATE teachers SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }

    public function delete(int $id): bool {
        $stmt = $this->pdo->prepare('DELETE FROM teachers WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function calculateFailureStats(int $teacherId): array {
        // Count total and failed students for this teacher using teacher_id
        $stmt = $this->pdo->prepare('
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = "Failed" THEN 1 ELSE 0 END) as failed
            FROM student_grades 
            WHERE teacher_id = ?
        ');
        $stmt->execute([$teacherId]);
        $stats = $stmt->fetch();
        
        $totalStudents = $stats['total'] ?? 0;
        $failedStudents = $stats['failed'] ?? 0;
        $failurePercentage = $totalStudents > 0 ? round(($failedStudents / $totalStudents) * 100, 2) : 0.00;

        // Calculate period-based statistics (P1, P2, P3)
        // For now, we'll use the same overall stats for all periods
        // In a real implementation, you might want to split by semester, academic year, etc.
        $p1Failed = $failedStudents;
        $p1Percent = $failurePercentage;
        $p1Category = $this->getPerformanceCategory($p1Percent);
        
        $p2Failed = $failedStudents;
        $p2Percent = $failurePercentage;
        $p2Category = $this->getPerformanceCategory($p2Percent);
        
        $p3Failed = $failedStudents;
        $p3Percent = $failurePercentage;
        $p3Category = $this->getPerformanceCategory($p3Percent);

        return [
            'enrolled_students' => $totalStudents,
            'failed_students' => $failedStudents,
            'failure_percentage' => $failurePercentage,
            'p1_failed' => $p1Failed,
            'p1_percent' => $p1Percent,
            'p1_category' => $p1Category,
            'p2_failed' => $p2Failed,
            'p2_percent' => $p2Percent,
            'p2_category' => $p2Category,
            'p3_failed' => $p3Failed,
            'p3_percent' => $p3Percent,
            'p3_category' => $p3Category,
        ];
    }

    private function getPerformanceCategory(float $percentage): string {
        if ($percentage > 40) {
            return 'RED (Above 40%)';
        } elseif ($percentage > 10) {
            return 'YELLOW (10.01%-40%)';
        } else {
            return 'GREEN (0.01%-10%)';
        }
    }

    public function updateFailureStats(int $teacherId): bool {
        $stats = $this->calculateFailureStats($teacherId);
        return $this->update($teacherId, $stats);
    }
}



