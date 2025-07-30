<?php
session_start();
require_once '../includes/auth_check.php';
require_once '../config/database.php';

if (isset($_GET['id'])) {
    $budget_id = intval($_GET['id']);
    
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        $stmt = $db->prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?");
        $stmt->execute([$budget_id, $_SESSION['user_id']]);
        
        header('Location: ../budget.php?success=Budget deleted successfully');
        exit();
        
    } catch(PDOException $e) {
        header('Location: ../budget.php?error=Failed to delete budget');
        exit();
    }
} else {
    header('Location: ../budget.php');
    exit();
}
?>
