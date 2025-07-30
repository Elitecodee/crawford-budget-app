<?php
session_start();
require_once 'includes/auth_check.php';
require_once 'config/database.php';

// Get user's financial data
$database = new Database();
$db = $database->getConnection();

// Get total income
$stmt = $db->prepare("SELECT SUM(amount) as total FROM income WHERE user_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$total_income = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

// Get total expenses
$stmt = $db->prepare("SELECT SUM(amount) as total FROM expenses WHERE user_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$total_expenses = $stmt->fetch(PDO::FETCH_ASSOC)['total'] ?? 0;

// Calculate net balance and savings rate
$net_balance = $total_income - $total_expenses;
$savings_rate = $total_income > 0 ? (($net_balance / $total_income) * 100) : 0;

// Get recent transactions
$stmt = $db->prepare("
    (SELECT 'income' as type, amount, description, category, date FROM income WHERE user_id = ?)
    UNION ALL
    (SELECT 'expense' as type, amount, description, category, date FROM expenses WHERE user_id = ?)
    ORDER BY date DESC
    LIMIT 10
");
$stmt->execute([$_SESSION['user_id'], $_SESSION['user_id']]);
$recent_transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Get expense categories for chart
$stmt = $db->prepare("SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY category");
$stmt->execute([$_SESSION['user_id']]);
$expense_categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crawford University Student Budget Tracker - Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                <div class="flex items-center space-x-2 md:space-x-3 text-white text-sm">
                    <span class="truncate max-w-[100px]"><?php echo htmlspecialchars($_SESSION['full_name']); ?></span>

                    <button onclick="showAddIncomeModal()" title="Add Income" class="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs md:text-sm">
                        <i class="fas fa-plus"></i><span class="hidden md:inline ml-1">Income</span>
                    </button>

                    <button onclick="showAddExpenseModal()" title="Add Expense" class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs md:text-sm">
                        <i class="fas fa-minus"></i><span class="hidden md:inline ml-1">Expense</span>
                    </button>

                    <div class="relative group">
                        <button title="More Options" class="bg-gray-700 hover:bg-gray-800 px-2 py-1 rounded text-xs md:text-sm">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                        <div class="absolute hidden group-hover:block bg-white text-black rounded shadow-lg mt-1 right-0 z-10 text-xs">
                            <a href="budget.php" class="block px-4 py-2 hover:bg-gray-100"><i class="fas fa-chart-pie mr-2"></i>Budget</a>
                            <a href="suggested-budget.php" class="block px-4 py-2 hover:bg-gray-100"><i class="fas fa-magic mr-2"></i>Smart Budget</a>
                            <a href="export.php" class="block px-4 py-2 hover:bg-gray-100"><i class="fas fa-download mr-2"></i>Export</a>
                            <a href="import.php" class="block px-4 py-2 hover:bg-gray-100"><i class="fas fa-upload mr-2"></i>Import</a>
                        </div>
                    </div>

                    <a href="auth/logout.php" title="Logout" class="hover:text-gray-300">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>

            </div>
        </div>
    </nav>

    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Welcome Message -->
        <div class="bg-green-100 border-l-4 border-green-500 p-4 mb-6">
            <div class="flex">
                <div class="flex-shrink-0">
                    <i class="fas fa-university text-green-500"></i>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-green-700">
                        <strong>Welcome <?php echo htmlspecialchars($_SESSION['full_name']); ?>!</strong>
                        Student ID: <?php echo htmlspecialchars($_SESSION['student_id']); ?> |
                        Department: <?php echo htmlspecialchars(ucwords(str_replace('-', ' ', $_SESSION['department']))); ?> |
                        Level: <?php echo htmlspecialchars($_SESSION['level']); ?>
                    </p>
                </div>
            </div>
        </div>

        <!-- Stats Overview -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-3 md:p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-wallet text-green-500 text-xl md:text-2xl"></i>
                        </div>
                        <div class="ml-3 md:ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-xs md:text-sm font-medium text-gray-500 truncate">Total Income</dt>
                                <dd class="text-sm md:text-lg font-medium text-gray-900">₦<?php echo number_format($total_income, 0); ?></dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-3 md:p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-credit-card text-red-500 text-xl md:text-2xl"></i>
                        </div>
                        <div class="ml-3 md:ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-xs md:text-sm font-medium text-gray-500 truncate">Total Expenses</dt>
                                <dd class="text-sm md:text-lg font-medium text-gray-900">₦<?php echo number_format($total_expenses, 0); ?></dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-3 md:p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-piggy-bank text-blue-500 text-xl md:text-2xl"></i>
                        </div>
                        <div class="ml-3 md:ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-xs md:text-sm font-medium text-gray-500 truncate">Balance</dt>
                                <dd class="text-sm md:text-lg font-medium <?php echo $net_balance >= 0 ? 'text-green-600' : 'text-red-600'; ?>">
                                    ₦<?php echo number_format($net_balance, 0); ?>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-3 md:p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="fas fa-chart-pie text-purple-500 text-xl md:text-2xl"></i>
                        </div>
                        <div class="ml-3 md:ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-xs md:text-sm font-medium text-gray-500 truncate">Savings Rate</dt>
                                <dd class="text-sm md:text-lg font-medium text-gray-900"><?php echo number_format($savings_rate, 1); ?>%</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Quick Tips for Students -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 class="text-lg font-medium text-blue-900 mb-2">
                <i class="fas fa-lightbulb text-blue-600 mr-2"></i>Student Financial Tips
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>• Track your monthly allowance and school fees</div>
                <div>• Set aside money for textbooks and materials</div>
                <div>• Budget for transportation and meals</div>
                <div>• Save for emergencies and unexpected expenses</div>
            </div>
        </div>

        <!-- Charts and Analysis -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white shadow rounded-lg p-6" style="height: 400px;">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
                <div style="height: 320px; position: relative;">
                    <?php if (empty($expense_categories)): ?>
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center">
                                <i class="fas fa-chart-pie text-gray-400 text-4xl mb-4"></i>
                                <p class="text-gray-500">No expense data yet</p>
                                <p class="text-sm text-gray-400">Add some expenses to see your spending breakdown</p>
                            </div>
                        </div>
                    <?php else: ?>
                        <canvas id="categoryChart"></canvas>
                    <?php endif; ?>
                </div>
            </div>

            <div class="bg-white shadow rounded-lg p-6" style="height: 400px;">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Financial Overview</h3>
                <div class="space-y-4 overflow-y-auto" style="height: 320px;">
                    <?php if ($total_income == 0 && $total_expenses == 0): ?>
                        <div class="flex items-center justify-center h-full">
                            <div class="text-center">
                                <i class="fas fa-chart-line text-gray-400 text-4xl mb-4"></i>
                                <p class="text-gray-500">No financial data yet</p>
                                <p class="text-sm text-gray-400">Start adding income and expenses to get insights</p>
                            </div>
                        </div>
                    <?php else: ?>
                        <?php if ($savings_rate >= 15): ?>
                            <div class="bg-green-50 border-l-4 border-green-400 p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-thumbs-up text-green-400"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm text-green-700">Excellent! Your savings rate of <?php echo number_format($savings_rate, 1); ?>% is great for a student.</p>
                                    </div>
                                </div>
                            </div>
                        <?php elseif ($savings_rate < 5): ?>
                            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm text-yellow-700">Your savings rate is <?php echo number_format($savings_rate, 1); ?>%. Try to save at least 10-15% of your allowance.</p>
                                    </div>
                                </div>
                            </div>
                        <?php else: ?>
                            <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                                <div class="flex">
                                    <div class="flex-shrink-0">
                                        <i class="fas fa-info-circle text-blue-400"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p class="text-sm text-blue-700">Your savings rate is <?php echo number_format($savings_rate, 1); ?>%. Try to reach 15% by reducing non-essential expenses.</p>
                                    </div>
                                </div>
                            </div>
                        <?php endif; ?>

                        <!-- Additional Financial Tips -->
                        <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                            <div class="flex">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-lightbulb text-blue-400"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="text-sm text-blue-700"><strong>Student Tip:</strong> Aim to allocate 60% for essentials, 25% for academic needs, and 15% for savings.</p>
                                </div>
                            </div>
                        </div>

                        <?php if ($total_expenses > 0): ?>
                            <?php
                            // Calculate top spending category
                            $top_category = '';
                            $top_amount = 0;
                            foreach ($expense_categories as $category) {
                                if ($category['total'] > $top_amount) {
                                    $top_amount = $category['total'];
                                    $top_category = $category['category'];
                                }
                            }
                            if ($top_category): ?>
                                <div class="bg-orange-50 border-l-4 border-orange-400 p-4">
                                    <div class="flex">
                                        <div class="flex-shrink-0">
                                            <i class="fas fa-info-circle text-orange-400"></i>
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm text-orange-700">Your highest spending category is <strong><?php echo ucwords(str_replace('_', ' ', $top_category)); ?></strong> (₦<?php echo number_format($top_amount, 0); ?>)</p>
                                        </div>
                                    </div>
                                </div>
                            <?php endif; ?>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Recent Transactions -->
        <div class="bg-white shadow rounded-lg">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Recent Transactions</h3>
            </div>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        <?php if (empty($recent_transactions)): ?>
                            <tr>
                                <td colspan="5" class="px-6 py-4 text-center text-gray-500">No transactions yet</td>
                            </tr>
                        <?php else: ?>
                            <?php foreach ($recent_transactions as $transaction): ?>
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <?php echo date('M d, Y', strtotime($transaction['date'])); ?>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <?php echo htmlspecialchars($transaction['description']); ?>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <?php echo htmlspecialchars(ucwords(str_replace('_', ' ', $transaction['category']))); ?>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium <?php echo $transaction['type'] === 'income' ? 'text-green-600' : 'text-red-600'; ?>">
                                        <?php echo $transaction['type'] === 'income' ? '+' : '-'; ?>₦<?php echo number_format($transaction['amount'], 0); ?>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full <?php echo $transaction['type'] === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'; ?>">
                                            <?php echo ucfirst($transaction['type']); ?>
                                        </span>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Add Income Modal -->
    <div id="incomeModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Add Income</h3>
                <form action="api/add_income.php" method="POST">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
                        <input type="number" step="0.01" name="amount" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <input type="text" name="description" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select name="category" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                            <option value="allowance">Monthly Allowance</option>
                            <option value="scholarship">Scholarship</option>
                            <option value="parttime">Part-time Job</option>
                            <option value="gift">Gift/Support</option>
                            <option value="freelance">Freelance Work</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input type="date" name="date" value="<?php echo date('Y-m-d'); ?>" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="hideIncomeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">Add Income</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Add Expense Modal -->
    <div id="expenseModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full hidden">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Add Expense</h3>
                <form action="api/add_expense.php" method="POST">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Amount (₦)</label>
                        <input type="number" step="0.01" name="amount" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <input type="text" name="description" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select name="category" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
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
                        <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input type="date" name="date" value="<?php echo date('Y-m-d'); ?>" required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="hideExpenseModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">Add Expense</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script>
        // Modal functions
        function showAddIncomeModal() {
            document.getElementById('incomeModal').classList.remove('hidden');
        }

        function hideIncomeModal() {
            document.getElementById('incomeModal').classList.add('hidden');
        }

        function showAddExpenseModal() {
            document.getElementById('expenseModal').classList.remove('hidden');
        }

        function hideExpenseModal() {
            document.getElementById('expenseModal').classList.add('hidden');
        }

        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target.classList.contains('bg-opacity-50')) {
                hideIncomeModal();
                hideExpenseModal();
            }
        });

        // Initialize chart
        const ctx = document.getElementById('categoryChart').getContext('2d');
        const categoryData = <?php echo json_encode($expense_categories); ?>;

        const labels = categoryData.map(item => item.category.charAt(0).toUpperCase() + item.category.slice(1));
        const data = categoryData.map(item => item.total);

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#EF4444', '#F97316', '#EAB308', '#22C55E',
                        '#06B6D4', '#3B82F6', '#8B5CF6', '#EC4899'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    </script>
</body>

</html>