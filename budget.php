<?php
session_start();
require_once 'includes/auth_check.php';
require_once 'config/database.php';

// Get user's budget data
$database = new Database();
$db = $database->getConnection();

// Get budgets
$stmt = $db->prepare("SELECT * FROM budgets WHERE user_id = ? ORDER BY created_at DESC");
$stmt->execute([$_SESSION['user_id']]);
$budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculate total budget
$total_budget = 0;
foreach ($budgets as $budget) {
    if ($budget['period'] === 'monthly') {
        $total_budget += $budget['amount'];
    } elseif ($budget['period'] === 'weekly') {
        $total_budget += $budget['amount'] * 4.33;
    } elseif ($budget['period'] === 'semester') {
        $total_budget += $budget['amount'] / 6; // Assuming 6 months per semester
    }
}

// Get current month expenses
$current_month = date('Y-m');
$stmt = $db->prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND DATE_FORMAT(date, '%Y-%m') = ?");
$stmt->execute([$_SESSION['user_id'], $current_month]);
$total_spent = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

$remaining = $total_budget - $total_spent;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crawford University Student Budget Tracker - Budget Planning</title>
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

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">Student Budget Planning</h1>
            <p class="text-gray-600 mt-2">Set spending limits for your allowance and track your progress</p>
        </div>

        <?php if (isset($_GET['success'])): ?>
            <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($_GET['success']); ?>
            </div>
        <?php endif; ?>

        <?php if (isset($_GET['error'])): ?>
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <?php echo htmlspecialchars($_GET['error']); ?>
            </div>
        <?php endif; ?>

        <!-- Student Budget Tips -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-medium text-green-900 mb-2">
                <i class="fas fa-lightbulb text-green-600 mr-2"></i>Student Budget Tips
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <div>• Allocate 60% for essentials (food, transport, accommodation)</div>
                <div>• Reserve 25% for academic needs (books, materials)</div>
                <div>• Save 15% for emergencies and future goals</div>
                <div>• Track daily expenses to avoid overspending</div>
            </div>
        </div>

        <!-- Budget Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Total Budget</p>
                        <p class="text-2xl font-bold text-gray-900">₦<?php echo number_format($total_budget, 0); ?></p>
                    </div>
                    <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-calculator text-blue-600"></i>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Total Spent</p>
                        <p class="text-2xl font-bold text-gray-900">₦<?php echo number_format($total_spent, 0); ?></p>
                    </div>
                    <div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-credit-card text-red-600"></i>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600">Remaining</p>
                        <p class="text-2xl font-bold <?php echo $remaining >= 0 ? 'text-green-600' : 'text-red-600'; ?>">
                            ₦<?php echo number_format($remaining, 0); ?>
                        </p>
                    </div>
                    <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-piggy-bank text-green-600"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Budget Categories -->
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900">Student Budget Categories</h3>
                <button onclick="showAddBudgetModal()" class="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700">
                    <i class="fas fa-plus mr-2"></i>Add Budget
                </button>
            </div>
            <div class="p-6">
                <?php if (empty($budgets)): ?>
                    <div class="text-center py-8">
                        <i class="fas fa-calculator text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-500">No budgets set yet. Add your first budget to get started!</p>
                    </div>
                <?php else: ?>
                    <div class="space-y-4">
                        <?php foreach ($budgets as $budget): ?>
                            <?php
                            // Calculate spent amount for this category in current month
                            $stmt = $db->prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND category = ? AND DATE_FORMAT(date, '%Y-%m') = ?");
                            $stmt->execute([$_SESSION['user_id'], $budget['category'], $current_month]);
                            $category_spent = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;
                            
                            // Convert budget to monthly amount
                            $monthly_budget = $budget['amount'];
                            if ($budget['period'] === 'weekly') {
                                $monthly_budget = $budget['amount'] * 4.33;
                            } elseif ($budget['period'] === 'semester') {
                                $monthly_budget = $budget['amount'] / 6;
                            }
                            
                            $remaining_budget = $monthly_budget - $category_spent;
                            $percentage = $monthly_budget > 0 ? min(($category_spent / $monthly_budget) * 100, 100) : 0;
                            $is_over_budget = $category_spent > $monthly_budget;
                            ?>
                            <div class="border border-gray-200 rounded-lg p-4">
                                <div class="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 class="font-medium text-gray-900"><?php echo htmlspecialchars(ucwords(str_replace('_', ' ', $budget['category']))); ?></h4>
                                        <p class="text-sm text-gray-500">₦<?php echo number_format($monthly_budget, 0); ?> <?php echo $budget['period']; ?></p>
                                    </div>
                                    <div class="flex space-x-2">
                                        <a href="api/delete_budget.php?id=<?php echo $budget['id']; ?>" 
                                           onclick="return confirm('Are you sure you want to delete this budget?')"
                                           class="text-gray-400 hover:text-red-600">
                                            <i class="fas fa-trash"></i>
                                        </a>
                                    </div>
                                </div>
                                
                                <div class="mb-2">
                                    <div class="flex justify-between text-sm">
                                        <span>Spent: ₦<?php echo number_format($category_spent, 0); ?></span>
                                        <span class="<?php echo $is_over_budget ? 'text-red-600' : 'text-green-600'; ?>">
                                            <?php echo $is_over_budget ? 'Over by ' : 'Remaining: '; ?>₦<?php echo number_format(abs($remaining_budget), 0); ?>
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="h-2 rounded-full transition-all duration-300 <?php echo $is_over_budget ? 'bg-red-500' : 'bg-green-500'; ?>" 
                                         style="width: <?php echo $percentage; ?>%"></div>
                                </div>
                                
                                <div class="mt-2 text-xs text-gray-500">
                                    <?php echo number_format($percentage, 1); ?>% of budget used
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Add Budget Modal -->
    <div id="budgetModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Add Budget Category</h3>
                <form action="api/add_budget.php" method="POST">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select name="category" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                            <option value="">Select category...</option>
                            <option value="food">Food & Meals</option>
                            <option value="transportation">Transportation</option>
                            <option value="textbooks">Textbooks & Materials</option>
                            <option value="accommodation">Accommodation</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="clothing">Clothing</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="internet">Internet & Data</option>
                            <option value="laundry">Laundry</option>
                            <option value="stationery">Stationery</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Budget Amount (₦)</label>
                        <input type="number" step="0.01" name="amount" required 
                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Period</label>
                        <select name="period" required 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                            <option value="monthly">Monthly</option>
                            <option value="weekly">Weekly</option>
                            <option value="semester">Per Semester</option>
                        </select>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="hideBudgetModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Add Budget</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        function showAddBudgetModal() {
            document.getElementById('budgetModal').classList.remove('hidden');
        }

        function hideBudgetModal() {
            document.getElementById('budgetModal').classList.add('hidden');
        }

        // Close modal when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('bg-opacity-50')) {
                hideBudgetModal();
            }
        });
    </script>
</body>
</html>
