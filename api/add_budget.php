<?php
session_start();
require_once '../includes/auth_check.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $category = $_POST['category'];
    $amount = floatval($_POST['amount']);
    $period = $_POST['period'];
    
    if (empty($category) || $amount <= 0 || empty($period)) {
        header('Location: ../budget.php?error=Please fill in all fields correctly');
        exit();
    }
    
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        // Check if budget already exists for this category
        $stmt = $db->prepare("SELECT id FROM budgets WHERE user_id = ? AND category = ?");
        $stmt->execute([$_SESSION['user_id'], $category]);
        
        if ($stmt->fetch()) {
            header('Location: ../budget.php?error=Budget already exists for this category');
            exit();
        }
        
        $stmt = $db->prepare("INSERT INTO budgets (user_id, category, amount, period) VALUES (?, ?, ?, ?)");
        $stmt->execute([$_SESSION['user_id'], $category, $amount, $period]);
        
        header('Location: ../budget.php?success=Budget added successfully');
        exit();
        
    } catch(PDOException $e) {
        header('Location: ../budget.php?error=Failed to add budget');
        exit();
    }
} else {
    header('Location: ../budget.php');
    exit();
}
?>
