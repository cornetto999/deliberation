<?php
/**
 * Script to populate sample data for testing P1, P2, P3 performance tracking
 */

require_once __DIR__ . '/config/connection.php';
require_once __DIR__ . '/models/Teacher.php';
require_once __DIR__ . '/models/Student.php';
require_once __DIR__ . '/models/Subject.php';
require_once __DIR__ . '/models/Grade.php';

try {
    $db = new DatabaseConnection();
    $conn = $db->pdo();
    
    echo "Populating sample data for testing...\n";
    
    // Create sample teachers with different performance levels
    $teachers = [
        [
            'teacher_id' => 'T001',
            'first_name' => 'John',
            'last_name' => 'Smith',
            'department' => 'Computer Science',
            'p1_failed' => 5,
            'p1_percent' => 8.33,
            'p1_category' => 'GREEN (0.01%-10%)',
            'p2_failed' => 12,
            'p2_percent' => 15.38,
            'p2_category' => 'YELLOW (10.01%-40%)',
            'p3_failed' => 3,
            'p3_percent' => 5.26,
            'p3_category' => 'GREEN (0.01%-10%)'
        ],
        [
            'teacher_id' => 'T002',
            'first_name' => 'Maria',
            'last_name' => 'Garcia',
            'department' => 'Mathematics',
            'p1_failed' => 20,
            'p1_percent' => 25.00,
            'p1_category' => 'YELLOW (10.01%-40%)',
            'p2_failed' => 18,
            'p2_percent' => 22.50,
            'p2_category' => 'YELLOW (10.01%-40%)',
            'p3_failed' => 15,
            'p3_percent' => 18.75,
            'p3_category' => 'YELLOW (10.01%-40%)'
        ],
        [
            'teacher_id' => 'T003',
            'first_name' => 'Robert',
            'last_name' => 'Johnson',
            'department' => 'Physics',
            'p1_failed' => 35,
            'p1_percent' => 45.45,
            'p1_category' => 'RED (Above 40%)',
            'p2_failed' => 30,
            'p2_percent' => 42.86,
            'p2_category' => 'RED (Above 40%)',
            'p3_failed' => 25,
            'p3_percent' => 35.71,
            'p3_category' => 'YELLOW (10.01%-40%)'
        ]
    ];
    
    $teacherModel = new TeacherModel($conn);
    $createdTeachers = 0;
    
    foreach ($teachers as $teacherData) {
        try {
            $teacherModel->create($teacherData);
            $createdTeachers++;
            echo "Created teacher: {$teacherData['first_name']} {$teacherData['last_name']}\n";
        } catch (Exception $e) {
            echo "Error creating teacher {$teacherData['first_name']}: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\nSample data populated successfully!\n";
    echo "Created {$createdTeachers} teachers with P1, P2, P3 performance data.\n";
    echo "\nYou can now check the Teachers page to see the performance tracking data.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}
?>

