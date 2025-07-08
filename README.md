# Student Budget Tracker

A PHP-based financial management system designed specifically for Nigerian students.

## Features

- **Student Authentication**: Registration and login system with student ID validation
- **Income Tracking**: Track allowances, scholarships, part-time jobs, and other income sources
- **Expense Management**: Categorize and monitor daily expenses like food, transportation, textbooks
- **Budget Planning**: Set monthly, weekly, or semester budgets for different categories
- **Financial Analytics**: Visual charts and AI-powered insights for spending patterns
- **Data Export**: Export financial data in CSV format or generate PDF reports
- **Nigerian Localization**: Uses Nigerian Naira (₦) currency and local formatting

## Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- XAMPP (recommended for local development)
- Web browser with JavaScript enabled

## Installation

1. **Download and Install XAMPP**
   - Download XAMPP from https://www.apachefriends.org/
   - Install and start Apache and MySQL services

2. **Setup the Project**
   - Extract the project files to `C:\xampp\htdocs\budget-tracker\`
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Create a new database named `budget_tracker`
   - Import the SQL file from `database/setup.sql`

3. **Configure Database Connection**
   - Open `config/database.php`
   - Update database credentials if needed (default: root/no password)

4. **Access the Application**
   - Open your web browser
   - Navigate to `http://localhost/budget-tracker/`

## Default Test Accounts

- **Email**: john.doe@student.crawford.edu.ng
- **Password**: password
- **Student ID**: CU/2024/001

- **Email**: jane.smith@student.crawford.edu.ng
- **Password**: password
- **Student ID**: CU/2024/002

## Project Structure

\`\`\`
budget-tracker/
├── index.php                 # Login page
├── register.php              # Registration page
├── dashboard.php             # Main dashboard
├── budget.php                # Budget management
├── export.php                # Data export functionality
├── config/
│   └── database.php          # Database configuration
├── auth/
│   ├── login.php             # Login processing
│   ├── register.php          # Registration processing
│   └── logout.php            # Logout processing
├── api/
│   ├── add_income.php        # Add income endpoint
│   ├── add_expense.php       # Add expense endpoint
│   ├── add_budget.php        # Add budget endpoint
│   └── delete_budget.php     # Delete budget endpoint
├── includes/
│   └── auth_check.php        # Authentication middleware
├── database/
│   └── setup.sql             # Database schema and sample data
└── README.md                 # This file
\`\`\`

## Usage

1. **Registration**: New students can register with their University details
2. **Dashboard**: View financial overview, add income/expenses, and see recent transactions
3. **Budget Planning**: Set spending limits for different categories
4. **Data Export**: Download financial data for personal records

## Student-Specific Features

- **Income Categories**: Monthly allowance, scholarships, part-time jobs, gifts
- **Expense Categories**: Food, transportation, textbooks, accommodation, internet data
- **Budget Recommendations**: 60% essentials, 25% academic needs, 15% savings
- **Nigerian Context**: Naira currency, local expense categories, student-focused tips

## Security Features

- Password hashing using PHP's password_hash()
- SQL injection prevention with prepared statements
- Session-based authentication
- Input validation and sanitization

## Contributing

This project is designed as a case study for University students. For improvements or bug reports, please contact the development team.

## License

This project is for educational purposes and is specific to University students.
\`\`\`

## 🎓 **Complete PHP Setup Instructions for XAMPP**

I've successfully converted the AI Budget Finance Tracker to a complete PHP application that you can run on XAMPP localhost! Here's what you need to do:

### **📋 Setup Steps:**

1. **Install XAMPP**
   - Download from https://www.apachefriends.org/
   - Install and start Apache + MySQL

2. **Setup Project**
   - Create folder: `C:\xampp\htdocs\budget-tracker\`
   - Copy all the PHP files into this folder

3. **Setup Database**
   - Open phpMyAdmin: `http://localhost/phpmyadmin`
   - Create database: `budget_tracker`
   - Import the `database/setup.sql` file

4. **Access Application**
   - Open browser: `http://localhost/budget-tracker/`

### **🔑 Test Login Credentials:**
- **Email**: `john.doe@student.crawford.edu.ng`
- **Password**: `password`

### **✨ Key PHP Features Implemented:**

1. **Complete Authentication System**
   - Registration with student details
   - Secure login with password hashing
   - Session management

2. **Database Integration**
   - MySQL database with proper relationships
   - Prepared statements for security
   - Sample data included

3. **Student-Specific Features**
   - Nigerian Naira (₦) currency
   - University branding
   - Student categories (allowance, textbooks, etc.)

4. **Core Functionality**
   - Add/view income and expenses
   - Budget planning and tracking
   - Data export (CSV/PDF)
   - Financial analytics with charts

5. **Security Features**
   - SQL injection prevention
   - Password hashing
   - Input validation
   - Authentication checks

The application is now fully functional as a PHP web application that you can run on your XAMPP localhost! 🚀
