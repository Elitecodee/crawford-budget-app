<?php
session_start();
require_once 'includes/auth_check.php';
require_once 'config/database.php';

// Get user's financial data
$database = new Database();
$db = $database->getConnection();

// Get user's average monthly income
$stmt = $db->prepare("
    SELECT AVG(amount) as avg_income, SUM(amount) as total_income, COUNT(*) as income_count
    FROM income 
    WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
");
$stmt->execute([$_SESSION['user_id']]);
$income_data = $stmt->fetch(PDO::FETCH_ASSOC);

$avg_monthly_income = $income_data['avg_income'] ?? 0;
$total_income = $income_data['total_income'] ?? 0;
$income_count = $income_data['income_count'] ?? 0;

// If no income data, use a default student allowance
if ($avg_monthly_income == 0) {
    $avg_monthly_income = 50000; // Default ₦50,000 monthly allowance
}

// Calculate suggested budget allocations (Nigerian student-focused)
$suggested_budget = [
    'food' => round($avg_monthly_income * 0.30), // 30% for food
    'transportation' => round($avg_monthly_income * 0.15), // 15% for transport
    'textbooks' => round($avg_monthly_income * 0.10), // 10% for books/materials
    'accommodation' => round($avg_monthly_income * 0.20), // 20% for accommodation
    'entertainment' => round($avg_monthly_income * 0.08), // 8% for entertainment
    'clothing' => round($avg_monthly_income * 0.05), // 5% for clothing
    'healthcare' => round($avg_monthly_income * 0.03), // 3% for healthcare
    'internet' => round($avg_monthly_income * 0.04), // 4% for internet/data
    'savings' => round($avg_monthly_income * 0.15), // 15% for savings
];

// Check if user has existing budgets
$stmt = $db->prepare("SELECT category, amount FROM budgets WHERE user_id = ?");
$stmt->execute([$_SESSION['user_id']]);
$existing_budgets = $stmt->fetchAll(PDO::FETCH_ASSOC);

$has_existing_budgets = !empty($existing_budgets);

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['apply_budget'])) {
    try {
        $db->beginTransaction();

        // Clear existing budgets if user chooses to replace
        if (isset($_POST['replace_existing'])) {
            $stmt = $db->prepare("DELETE FROM budgets WHERE user_id = ?");
            $stmt->execute([$_SESSION['user_id']]);
        }

        // Insert new budget categories
        $stmt = $db->prepare("INSERT INTO budgets (user_id, category, amount, period) VALUES (?, ?, ?, 'monthly') ON DUPLICATE KEY UPDATE amount = VALUES(amount)");

        foreach ($_POST['budget'] as $category => $amount) {
            if ($amount > 0) {
                $stmt->execute([$_SESSION['user_id'], $category, $amount]);
            }
        }

        $db->commit();
        header('Location: budget.php?success=Smart budget applied successfully');
        exit();
    } catch (PDOException $e) {
        $db->rollback();
        $error_message = "Failed to apply budget. Please try again.";
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crawford University Student Budget Tracker - Smart Budget Suggestions</title>
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
            <h1 class="text-3xl font-bold text-gray-900">Smart Budget Suggestions</h1>
            <p class="text-gray-600 mt-2">AI-powered budget recommendations based on your income and student lifestyle</p>
        </div>

        <!-- Income Analysis -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h3 class="text-lg font-semibold mb-4">
                <i class="fas fa-chart-line text-blue-500 mr-2"></i>
                Your Income Analysis
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">₦<?php echo number_format($avg_monthly_income, 0); ?></div>
                    <div class="text-sm text-gray-600">
                        <?php if ($income_count > 0): ?>
                            Average Monthly Income
                        <?php else: ?>
                            Estimated Monthly Allowance
                        <?php endif; ?>
                    </div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600"><?php echo $income_count; ?></div>
                    <div class="text-sm text-gray-600">Income Entries (Last 3 Months)</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600">₦<?php echo number_format($total_income, 0); ?></div>
                    <div class="text-sm text-gray-600">Total Income (Last 3 Months)</div>
                </div>
            </div>

            <?php if ($income_count == 0): ?>
                <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex">
                        <i class="fas fa-info-circle text-yellow-500 mr-2 mt-1"></i>
                        <div>
                            <p class="text-sm text-yellow-800">
                                <strong>No income data found.</strong> We've used a typical Nigerian student allowance of ₦50,000 for suggestions.
                                Add your actual income to get personalized recommendations.
                            </p>
                        </div>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <!-- Budget Methodology -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 class="text-lg font-semibold text-blue-900 mb-4">
                <i class="fas fa-brain text-blue-600 mr-2"></i>
                How We Calculate Your Smart Budget
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                    <h4 class="font-medium mb-2">Essential Expenses (65%)</h4>
                    <ul class="space-y-1">
                        <li>• Food & Meals: 30%</li>
                        <li>• Accommodation: 20%</li>
                        <li>• Transportation: 15%</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Academic & Personal (20%)</h4>
                    <ul class="space-y-1">
                        <li>• Textbooks & Materials: 10%</li>
                        <li>• Entertainment: 8%</li>
                        <li>• Other expenses: 2%</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Savings & Emergency (15%)</h4>
                    <ul class="space-y-1">
                        <li>• Emergency fund</li>
                        <li>• Future goals</li>
                        <li>• Unexpected expenses</li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Based on Nigerian Student Data</h4>
                    <ul class="space-y-1">
                        <li>• University living costs</li>
                        <li>• Local price analysis</li>
                        <li>• Student spending patterns</li>
                    </ul>
                </div>
            </div>
        </div>

        <?php if ($has_existing_budgets): ?>
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div class="flex">
                    <i class="fas fa-exclamation-triangle text-orange-500 mr-2 mt-1"></i>
                    <div>
                        <p class="text-sm text-orange-800">
                            <strong>You already have existing budgets.</strong> Applying this smart budget will either update your existing categories or add new ones.
                        </p>
                    </div>
                </div>
            </div>
        <?php endif; ?>

        <!-- Suggested Budget -->
        <form method="POST" class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-medium text-gray-900">Your Personalized Budget Plan</h3>
                <p class="text-sm text-gray-600 mt-1">Review and adjust these suggestions before applying</p>
            </div>

            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <?php
                    $category_info = [
                        'food' => ['name' => 'Food & Meals', 'icon' => 'utensils', 'color' => 'green', 'desc' => 'Daily meals, snacks, groceries'],
                        'transportation' => ['name' => 'Transportation', 'icon' => 'bus', 'color' => 'blue', 'desc' => 'Bus fare, taxi, fuel'],
                        'textbooks' => ['name' => 'Textbooks & Materials', 'icon' => 'book', 'color' => 'purple', 'desc' => 'Books, stationery, supplies'],
                        'accommodation' => ['name' => 'Accommodation', 'icon' => 'home', 'color' => 'indigo', 'desc' => 'Rent, utilities, maintenance'],
                        'entertainment' => ['name' => 'Entertainment', 'icon' => 'gamepad', 'color' => 'pink', 'desc' => 'Movies, games, social activities'],
                        'clothing' => ['name' => 'Clothing', 'icon' => 'tshirt', 'color' => 'yellow', 'desc' => 'Clothes, shoes, accessories'],
                        'healthcare' => ['name' => 'Healthcare', 'icon' => 'heartbeat', 'color' => 'red', 'desc' => 'Medical, pharmacy, wellness'],
                        'internet' => ['name' => 'Internet & Data', 'icon' => 'wifi', 'color' => 'cyan', 'desc' => 'Data plans, internet bills'],
                        'savings' => ['name' => 'Savings & Emergency', 'icon' => 'piggy-bank', 'color' => 'emerald', 'desc' => 'Emergency fund, future goals']
                    ];

                    foreach ($suggested_budget as $category => $amount):
                        $info = $category_info[$category];
                        $percentage = round(($amount / $avg_monthly_income) * 100, 1);
                    ?>
                        <div class="border border-gray-200 rounded-lg p-4 hover:border-<?php echo $info['color']; ?>-300 transition-colors">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex items-center">
                                    <div class="h-10 w-10 bg-<?php echo $info['color']; ?>-100 rounded-full flex items-center justify-center mr-3">
                                        <i class="fas fa-<?php echo $info['icon']; ?> text-<?php echo $info['color']; ?>-600"></i>
                                    </div>
                                    <div>
                                        <h4 class="font-medium text-gray-900"><?php echo $info['name']; ?></h4>
                                        <p class="text-xs text-gray-500"><?php echo $info['desc']; ?></p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <div class="text-sm font-medium text-<?php echo $info['color']; ?>-600"><?php echo $percentage; ?>%</div>
                                </div>
                            </div>

                            <div class="mb-2">
                                <label class="block text-sm font-medium text-gray-700 mb-1">Monthly Budget (₦)</label>
                                <input
                                    type="number"
                                    name="budget[<?php echo $category; ?>]"
                                    value="<?php echo $amount; ?>"
                                    min="0"
                                    step="100"
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-<?php echo $info['color']; ?>-500 focus:border-<?php echo $info['color']; ?>-500">
                            </div>

                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-<?php echo $info['color']; ?>-500 h-2 rounded-full" style="width: <?php echo min($percentage, 100); ?>%"></div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>

                <!-- Budget Summary -->
                <div class="mt-8 bg-gray-50 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-3">Budget Summary</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div class="text-lg font-bold text-gray-900" id="totalBudget">₦<?php echo number_format(array_sum($suggested_budget), 0); ?></div>
                            <div class="text-xs text-gray-600">Total Budget</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold text-green-600">₦<?php echo number_format($avg_monthly_income, 0); ?></div>
                            <div class="text-xs text-gray-600">Monthly Income</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold <?php echo (array_sum($suggested_budget) <= $avg_monthly_income) ? 'text-green-600' : 'text-red-600'; ?>" id="remaining">
                                ₦<?php echo number_format($avg_monthly_income - array_sum($suggested_budget), 0); ?>
                            </div>
                            <div class="text-xs text-gray-600">Remaining</div>
                        </div>
                        <div>
                            <div class="text-lg font-bold text-blue-600" id="budgetPercentage">
                                <?php echo round((array_sum($suggested_budget) / $avg_monthly_income) * 100, 1); ?>%
                            </div>
                            <div class="text-xs text-gray-600">of Income</div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="mt-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <?php if ($has_existing_budgets): ?>
                        <label class="flex items-center">
                            <input type="checkbox" name="replace_existing" class="rounded border-gray-300 text-green-600 focus:ring-green-500">
                            <span class="ml-2 text-sm text-gray-700">Replace my existing budgets</span>
                        </label>
                    <?php endif; ?>

                    <div class="flex space-x-3">
                        <a href="dashboard.php" class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                            Cancel
                        </a>
                        <button type="submit" name="apply_budget" class="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                            <i class="fas fa-magic mr-2"></i>Apply Smart Budget
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </div>

    <script>
        // Update budget summary when amounts change
        document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('input[name^="budget["]');
            const monthlyIncome = <?php echo $avg_monthly_income; ?>;

            function updateSummary() {
                let total = 0;
                inputs.forEach(input => {
                    total += parseFloat(input.value) || 0;
                });

                document.getElementById('totalBudget').textContent = '₦' + total.toLocaleString();

                const remaining = monthlyIncome - total;
                const remainingEl = document.getElementById('remaining');
                remainingEl.textContent = '₦' + remaining.toLocaleString();
                remainingEl.className = remaining >= 0 ? 'text-lg font-bold text-green-600' : 'text-lg font-bold text-red-600';

                const percentage = monthlyIncome > 0 ? (total / monthlyIncome) * 100 : 0;
                document.getElementById('budgetPercentage').textContent = percentage.toFixed(1) + '%';
            }

            inputs.forEach(input => {
                input.addEventListener('input', updateSummary);
            });
        });
    </script>
</body>

</html>