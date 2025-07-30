<?php
session_start();
require_once '../includes/auth_check.php';
require_once '../config/database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

if (!isset($_POST['action']) || $_POST['action'] !== 'bulk_import') {
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
    exit();
}

if (!isset($_POST['transactions'])) {
    echo json_encode(['success' => false, 'message' => 'No transaction data provided']);
    exit();
}

try {
    $transactions = json_decode($_POST['transactions'], true);
    
    if (!$transactions || !is_array($transactions)) {
        echo json_encode(['success' => false, 'message' => 'Invalid transaction data']);
        exit();
    }

    $database = new Database();
    $db = $database->getConnection();
    
    $db->beginTransaction();
    
    $imported = 0;
    $duplicates = 0;
    $errors = 0;
    
    foreach ($transactions as $transaction) {
        try {
            // Validate required fields
            if (!isset($transaction['date']) || !isset($transaction['description']) || !isset($transaction['amount']) || !isset($transaction['type'])) {
                $errors++;
                continue;
            }
            
            $table = $transaction['type'] === 'income' ? 'income' : 'expenses';
            
            // Check for duplicates
            $stmt = $db->prepare("SELECT COUNT(*) FROM $table WHERE user_id = ? AND date = ? AND description = ? AND ABS(amount - ?) < 0.01");
            $stmt->execute([
                $_SESSION['user_id'], 
                $transaction['date'], 
                $transaction['description'], 
                abs($transaction['amount'])
            ]);
            
            if ($stmt->fetchColumn() > 0) {
                $duplicates++;
                continue;
            }
            
            // Insert transaction
            $stmt = $db->prepare("INSERT INTO $table (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([
                $_SESSION['user_id'],
                abs($transaction['amount']),
                $transaction['description'],
                $transaction['category'],
                $transaction['date']
            ]);
            
            $imported++;
            
        } catch (Exception $e) {
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
    
} catch (Exception $e) {
    if (isset($db)) {
        $db->rollback();
    }
    echo json_encode(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()]);
}
?>
