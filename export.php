<?php
session_start();
require_once 'includes/auth_check.php';
require_once 'config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get export type
$export_type = $_GET['type'] ?? 'all';

// Get user's data
$stmt = $db->prepare("SELECT * FROM income WHERE user_id = ? ORDER BY date DESC");
$stmt->execute([$_SESSION['user_id']]);
$income_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $db->prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC");
$stmt->execute([$_SESSION['user_id']]);
$expense_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmt = $db->prepare("SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$_SESSION['user_id']]);
$budget_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate totals
$total_income = array_sum(array_column($income_data, 'amount'));
$total_expenses = array_sum(array_column($expense_data, 'amount'));
$net_balance = $total_income - $total_expenses;

if (isset($_GET['download'])) {
    switch ($export_type) {
        case 'csv':
            exportToCSV($income_data, $expense_data, $budget_data);
            break;
        case 'pdf':
            exportToPDF($income_data, $expense_data, $total_income, $total_expenses, $net_balance);
            break;
    }
    exit();
}

function exportToCSV($income_data, $expense_data, $budget_data) {
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="crawford_student_financial_data_' . date('Y-m-d') . '.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Income data
    fputcsv($output, ['INCOME DATA']);
    fputcsv($output, ['Date', 'Description', 'Category', 'Amount (NGN)']);
    foreach ($income_data as $income) {
        fputcsv($output, [$income['date'], $income['description'], $income['category'], $income['amount']]);
    }
    
    fputcsv($output, []);
    
    // Expense data
    fputcsv($output, ['EXPENSE DATA']);
    fputcsv($output, ['Date', 'Description', 'Category', 'Amount (NGN)']);
    foreach ($expense_data as $expense) {
        fputcsv($output, [$expense['date'], $expense['description'], $expense['category'], $expense['amount']]);
    }
    
    fputcsv($output, []);
    
    // Budget data
    fputcsv($output, ['BUDGET DATA']);
    fputcsv($output, ['Category', 'Amount (NGN)', 'Period', 'Created Date']);
    foreach ($budget_data as $budget) {
        fputcsv($output, [$budget['category'], $budget['amount'], $budget['period'], $budget['created_at']]);
    }
    
    fclose($output);
}

function exportToPDF($income_data, $expense_data, $total_income, $total_expenses, $net_balance) {
    header('Content-Type: text/html');
    header('Content-Disposition: attachment; filename="crawford_student_financial_report_' . date('Y-m-d') . '.html"');
    
    echo generateHTMLReport($income_data, $expense_data, $total_income, $total_expenses, $net_balance);
}

function generateHTMLReport($income_data, $expense_data, $total_income, $total_expenses, $net_balance) {
    $savings_rate = $total_income > 0 ? (($net_balance / $total_income) * 100) : 0;
    
    $html = '<!DOCTYPE html>
    <html>
    <head>
        <title>Crawford University Student Financial Report</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .university-logo { color: #16a34a; font-size: 24px; font-weight: bold; }
            .summary { background: #f0fdf4; padding: 20px; margin-bottom: 30px; border-left: 4px solid #16a34a; }
            .section { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #16a34a; color: white; }
            .positive { color: #16a34a; }
            .negative { color: #dc2626; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="university-logo">Crawford University</div>
            <h1>Student Financial Report</h1>
            <p>Generated on ' . date('F d, Y') . '</p>
        </div>
        
        <div class="summary">
            <h2>Financial Summary</h2>
            <p><strong>Total Income:</strong> <span class="positive">₦' . number_format($total_income, 0) . '</span></p>
            <p><strong>Total Expenses:</strong> <span class="negative">₦' . number_format($total_expenses, 0) . '</span></p>
            <p><strong>Net Balance:</strong> <span class="' . ($net_balance >= 0 ? 'positive' : 'negative') . '">₦' . number_format($net_balance, 0) . '</span></p>
            <p><strong>Savings Rate:</strong> ' . number_format($savings_rate, 1) . '%</p>
        </div>
        
        <div class="section">
            <h2>Recent Income</h2>
            <table>
                <thead>
                    <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount (₦)</th></tr>
                </thead>
                <tbody>';
    
    foreach (array_slice($income_data, 0, 10) as $income) {
        $html .= '<tr>
            <td>' . date('M d, Y', strtotime($income['date'])) . '</td>
            <td>' . htmlspecialchars($income['description']) . '</td>
            <td>' . htmlspecialchars(ucwords(str_replace('_', ' ', $income['category']))) . '</td>
            <td>₦' . number_format($income['amount'], 0) . '</td>
        </tr>';
    }
    
    $html .= '</tbody>
            </table>
        </div>
        
        <div class="section">
            <h2>Recent Expenses</h2>
            <table>
                <thead>
                    <tr><th>Date</th><th>Description</th><th>Category</th><th>Amount (₦)</th></tr>
                </thead>
                <tbody>';
    
    foreach (array_slice($expense_data, 0, 10) as $expense) {
        $html .= '<tr>
            <td>' . date('M d, Y', strtotime($expense['date'])) . '</td>
            <td>' . htmlspecialchars($expense['description']) . '</td>
            <td>' . htmlspecialchars(ucwords(str_replace('_', ' ', $expense['category']))) . '</td>
            <td>₦' . number_format($expense['amount'], 0) . '</td>
        </tr>';
    }
    
    $html .= '</tbody>
            </table>
        </div>
        
        <div class="footer">
            <p>Crawford University Student Budget Tracker</p>
            <p>This report is for personal financial management purposes</p>
        </div>
    </body>
    </html>';
    
    return $html;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crawford University Student Budget Tracker - Export Data</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-green-800 shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <div class="flex-shrink-0 flex items-center">
                        <div class="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-graduation-cap text-white text-sm"></i>
                        </div>
                        <span class="ml-2 text-xl font-bold text-white">Crawford University Budget Tracker</span>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <a href="dashboard.php" class="text-white hover:text-gray-300">
                        <i class="fas fa-arrow-left mr-2"></i>Back to Dashboard
                    </a>
                    <a href="auth/logout.php" class="text-white hover:text-gray-300">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </div>
        </div>
    </nav>

    <div class="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Export Financial Data</h1>
            <p class="text-gray-600 mt-2">Download your financial data for backup or analysis</p>
        </div>

        <!-- Export Options -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <i class="fas fa-file-csv text-green-500 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">CSV Export</h3>
                </div>
                <p class="text-gray-600 mb-4">Export all your financial data in CSV format for use in Excel or other spreadsheet applications.</p>
                <a href="export.php?type=csv&download=1" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block">
                    <i class="fas fa-download mr-2"></i>Download CSV
                </a>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <i class="fas fa-file-pdf text-red-500 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">PDF Report</h3>
                </div>
                <p class="text-gray-600 mb-4">Generate a comprehensive financial report in HTML format that can be printed or saved as PDF.</p>
                <a href="export.php?type=pdf&download=1" class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 inline-block">
                    <i class="fas fa-file-pdf mr-2"></i>Generate Report
                </a>
            </div>
        </div>

        <!-- Data Summary -->
        <div class="mt-8 bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Data Summary</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600"><?php echo count($income_data); ?></div>
                    <div class="text-sm text-gray-600">Income Records</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600"><?php echo count($expense_data); ?></div>
                    <div class="text-sm text-gray-600">Expense Records</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600"><?php echo count($budget_data); ?></div>
                    <div class="text-sm text-gray-600">Budget Categories</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
