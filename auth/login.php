<?php
session_start();
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    
    if (empty($email) || empty($password)) {
        header('Location: ../index.php?error=Please fill in all fields');
        exit();
    }
    
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        $stmt = $db->prepare("SELECT id, full_name, email, password, student_id, department, level FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['full_name'] = $user['full_name'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['student_id'] = $user['student_id'];
            $_SESSION['department'] = $user['department'];
            $_SESSION['level'] = $user['level'];
            
            header('Location: ../dashboard.php');
            exit();
        } else {
            header('Location: ../index.php?error=Invalid email or password');
            exit();
        }
    } catch(PDOException $e) {
        header('Location: ../index.php?error=Login failed. Please try again.');
        exit();
    }
} else {
    header('Location: ../index.php');
    exit();
}
?>
