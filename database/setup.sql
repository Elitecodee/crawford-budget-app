-- Create database
CREATE DATABASE IF NOT EXISTS crawford_budget_tracker;
USE crawford_budget_tracker;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    level VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Income table
CREATE TABLE income (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Expenses table
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Budgets table
CREATE TABLE budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Financial goals table
CREATE TABLE financial_goals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    target_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_income_user_date ON income(user_id, date);
CREATE INDEX idx_expenses_user_date ON expenses(user_id, date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_income_category ON income(category);

-- Insert sample data for testing
INSERT INTO users (full_name, student_id, email, password, department, level) VALUES
('John Doe', 'CU/2024/001', 'john.doe@student.crawford.edu.ng', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'computer-science', '200'),
('Jane Smith', 'CU/2024/002', 'jane.smith@student.crawford.edu.ng', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'business-admin', '300');

-- Sample income data
INSERT INTO income (user_id, amount, description, category, date) VALUES
(1, 50000, 'Monthly Allowance from Parents', 'allowance', '2024-01-01'),
(1, 25000, 'Part-time Job Payment', 'parttime', '2024-01-15'),
(2, 60000, 'Monthly Allowance', 'allowance', '2024-01-01'),
(2, 15000, 'Scholarship Payment', 'scholarship', '2024-01-10');

-- Sample expense data
INSERT INTO expenses (user_id, amount, description, category, date) VALUES
(1, 15000, 'Food for the week', 'food', '2024-01-02'),
(1, 5000, 'Transportation to campus', 'transportation', '2024-01-03'),
(1, 12000, 'Textbooks for new semester', 'textbooks', '2024-01-05'),
(2, 18000, 'Accommodation payment', 'accommodation', '2024-01-02'),
(2, 3000, 'Internet data bundle', 'internet', '2024-01-04');

-- Sample budget data
INSERT INTO budgets (user_id, category, amount, period) VALUES
(1, 'food', 20000, 'monthly'),
(1, 'transportation', 8000, 'monthly'),
(1, 'textbooks', 15000, 'semester'),
(2, 'accommodation', 25000, 'monthly'),
(2, 'food', 18000, 'monthly');
