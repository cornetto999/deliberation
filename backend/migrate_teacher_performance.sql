-- Migration script to add performance tracking fields to teachers table
-- Run this script to update existing database

USE school_db;

-- Add performance tracking columns to teachers table
ALTER TABLE teachers 
ADD COLUMN p1_failed INT DEFAULT 0 AFTER failure_percentage,
ADD COLUMN p1_percent DECIMAL(5,2) DEFAULT 0.00 AFTER p1_failed,
ADD COLUMN p1_category VARCHAR(50) DEFAULT 'GREEN (0.01%-10%)' AFTER p1_percent,
ADD COLUMN p2_failed INT DEFAULT 0 AFTER p1_category,
ADD COLUMN p2_percent DECIMAL(5,2) DEFAULT 0.00 AFTER p2_failed,
ADD COLUMN p2_category VARCHAR(50) DEFAULT 'GREEN (0.01%-10%)' AFTER p2_percent,
ADD COLUMN p3_failed INT DEFAULT 0 AFTER p2_category,
ADD COLUMN p3_percent DECIMAL(5,2) DEFAULT 0.00 AFTER p3_failed,
ADD COLUMN p3_category VARCHAR(50) DEFAULT 'GREEN (0.01%-10%)' AFTER p3_percent;

-- Update existing records to have default values
UPDATE teachers SET 
    p1_failed = 0,
    p1_percent = 0.00,
    p1_category = 'GREEN (0.01%-10%)',
    p2_failed = 0,
    p2_percent = 0.00,
    p2_category = 'GREEN (0.01%-10%)',
    p3_failed = 0,
    p3_percent = 0.00,
    p3_category = 'GREEN (0.01%-10%)'
WHERE p1_failed IS NULL;
