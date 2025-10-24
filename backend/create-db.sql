-- Create database if it doesn't exist
SELECT 'CREATE DATABASE financedb'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'financedb')\gexec
