<?php
/**
 * Database Setup Script for PHINMA COC Deliberation System
 * Run this script to initialize the database with sample data
 */

require_once 'backend/config/connection.php';

try {
    $db = new DatabaseConnection();
    $pdo = $db->pdo();
    
    echo "Setting up database...\n";
    
    // Read and execute schema
    $schema = file_get_contents('backend/schema.sql');
    $statements = explode(';', $schema);
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            $pdo->exec($statement);
        }
    }
    
    echo "Schema created successfully!\n";
    
    // Read and execute sample data
    $sampleData = file_get_contents('backend/phinma_coc_data.sql');
    $statements = explode(';', $sampleData);
    
    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            $pdo->exec($statement);
        }
    }
    
    echo "Sample data inserted successfully!\n";
    echo "Database setup completed!\n";
    echo "\nYou can now access the system at: http://localhost/deliberation/\n";
    echo "Default admin credentials:\n";
    echo "Username: admin\n";
    echo "Password: admin123\n";
    
} catch (Exception $e) {
    echo "Error setting up database: " . $e->getMessage() . "\n";
}
?>








