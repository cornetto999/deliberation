<?php
/**
 * Script to update teacher failure statistics
 * Run this after adding the teacher_id field to student_grades table
 */

require_once __DIR__ . '/config/connection.php';
require_once __DIR__ . '/models/Teacher.php';

try {
    $db = new DatabaseConnection();
    $conn = $db->pdo();
    $teacher = new TeacherModel($conn);
    
    echo "Starting teacher failure statistics update...\n";
    
    // Get all teachers
    $teachers = $teacher->all();
    $updated = 0;
    $errors = 0;
    
    foreach ($teachers as $teacherRecord) {
        try {
            $teacherId = $teacherRecord['id'];
            $teacherName = $teacherRecord['first_name'] . ' ' . $teacherRecord['last_name'];
            
            echo "Updating stats for teacher: {$teacherName} (ID: {$teacherId})\n";
            
            if ($teacher->updateFailureStats($teacherId)) {
                $updated++;
                echo "  ✓ Updated successfully\n";
            } else {
                $errors++;
                echo "  ✗ Failed to update\n";
            }
        } catch (Exception $e) {
            $errors++;
            echo "  ✗ Error: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nUpdate complete!\n";
    echo "Teachers updated: {$updated}\n";
    echo "Errors: {$errors}\n";
    
} catch (Exception $e) {
    echo "Fatal error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

