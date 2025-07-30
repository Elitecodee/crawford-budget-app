<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// Get auth token from header or input
$authToken = '';
if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authToken = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
} elseif (isset($input['token'])) {
    $authToken = $input['token'];
}

if (empty($authToken)) {
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit;
}

// Validate user
$stmt = $db->prepare("SELECT id FROM users WHERE session_token = ?");
$stmt->execute([$authToken]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Invalid authentication']);
    exit;
}

$userId = $user['id'];

switch($method) {
    case 'GET':
        getTransactions($db, $userId);
        break;
    case 'POST':
        if (isset($input['action'])) {
            switch($input['action']) {
                case 'add_income':
                    addIncome($db, $userId, $input);
                    break;
                case 'add_expense':
                    addExpense($db, $userId, $input);
                    break;
                case 'bulk_import':
                    bulkImportTransactions($db, $userId, $input);
                    break;
                default:
                    echo json_encode(['success' => false, 'message' => 'Invalid action']);
            }
        }
        break;
    case 'PUT':
        updateTransaction($db, $userId, $input);
        break;
    case 'DELETE':
        deleteTransaction($db, $userId, $input);
        break;
    default:
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function getTransactions($db, $userId) {
    try {
        // Get income
        $stmt = $db->prepare("SELECT * FROM income WHERE user_id = ? ORDER BY date DESC");
        $stmt->execute([$userId]);
        $income = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get expenses
        $stmt = $db->prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC");
        $stmt->execute([$userId]);
        $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'data' => [
                'income' => $income,
                'expenses' => $expenses
            ]
        ]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch transactions']);
    }
}

function addIncome($db, $userId, $input) {
    try {
        $stmt = $db->prepare("INSERT INTO income (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $input['amount'],
            $input['description'],
            $input['category'],
            $input['date']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Income added successfully']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to add income']);
    }
}

function addExpense($db, $userId, $input) {
    try {
        $stmt = $db->prepare("INSERT INTO expenses (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $userId,
            $input['amount'],
            $input['description'],
            $input['category'],
            $input['date']
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Expense added successfully']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to add expense']);
    }
}

function bulkImportTransactions($db, $userId, $input) {
    try {
        $db->beginTransaction();
        
        $imported = 0;
        $duplicates = 0;
        $errors = 0;
        
        foreach ($input['transactions'] as $transaction) {
            try {
                // Check for duplicates
                $table = $transaction['type'] === 'income' ? 'income' : 'expenses';
                $stmt = $db->prepare("SELECT COUNT(*) FROM $table WHERE user_id = ? AND date = ? AND description = ? AND ABS(amount - ?) < 0.01");
                $stmt->execute([$userId, $transaction['date'], $transaction['description'], $transaction['amount']]);
                
                if ($stmt->fetchColumn() > 0) {
                    $duplicates++;
                    continue;
                }
                
                // Insert transaction
                $stmt = $db->prepare("INSERT INTO $table (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $userId,
                    abs($transaction['amount']),
                    $transaction['description'],
                    $transaction['category'],
                    $transaction['date']
                ]);
                
                $imported++;
                
            } catch(Exception $e) {
                $errors++;
                error_log("Bulk import error: " . $e->getMessage());
            }
        }
        
        $db->commit();
        
        echo json_encode([
            'success' => true,
            'imported' => $imported,
            'duplicates' => $duplicates,
            'errors' => $errors
        ]);
        
    } catch(Exception $e) {
        $db->rollback();
        echo json_encode(['success' => false, 'message' => 'Bulk import failed']);
    }
}

function updateTransaction($db, $userId, $input) {
    try {
        $table = $input['type'] === 'income' ? 'income' : 'expenses';
        $stmt = $db->prepare("UPDATE $table SET amount = ?, description = ?, category = ?, date = ? WHERE id = ? AND user_id = ?");
        $stmt->execute([
            $input['amount'],
            $input['description'],
            $input['category'],
            $input['date'],
            $input['id'],
            $userId
        ]);
        
        echo json_encode(['success' => true, 'message' => 'Transaction updated successfully']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to update transaction']);
    }
}

function deleteTransaction($db, $userId, $input) {
    try {
        $table = $input['type'] === 'income' ? 'income' : 'expenses';
        $stmt = $db->prepare("DELETE FROM $table WHERE id = ? AND user_id = ?");
        $stmt->execute([$input['id'], $userId]);
        
        echo json_encode(['success' => true, 'message' => 'Transaction deleted successfully']);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Failed to delete transaction']);
    }
}
?>
