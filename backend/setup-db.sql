-- Create database user
CREATE USER finance_user WITH PASSWORD 'finance_pass';

-- Create database
CREATE DATABASE financedb OWNER finance_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE financedb TO finance_user;

-- Connect to the database and grant schema privileges
\c financedb
GRANT ALL ON SCHEMA public TO finance_user;
