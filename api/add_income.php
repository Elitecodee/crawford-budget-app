<?php
session_start();
require_once '../includes/auth_check.php';
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $amount = floatval($_POST['amount']);
    $description = trim($_POST['description']);
    $category = $_POST['category'];
    $date = $_POST['date'];
    
    if ($amount <= 0 || empty($description) || empty($category) || empty($date)) {
        header('Location: ../dashboard.php?error=Please fill in all fields correctly');
        exit();
    }
    
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        $stmt = $db->prepare("INSERT INTO income (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$_SESSION['user_id'], $amount, $description, $category, $date]);
        
        header('Location: ../dashboard.php?success=Income added successfully');
        exit();
        
    } catch(PDOException $e) {
        header('Location: ../dashboard.php?error=Failed to add income');
        exit();
    }
} else {
    header('Location: ../dashboard.php');
    exit();
}
?>
