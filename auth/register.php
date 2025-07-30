<?php
session_start();
require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $full_name = trim($_POST['full_name']);
    $student_id = trim($_POST['student_id']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $department = $_POST['department'];
    $level = $_POST['level'];
    
    // Validation
    if (empty($full_name) || empty($student_id) || empty($email) || empty($password) || empty($department) || empty($level)) {
        header('Location: ../register.php?error=Please fill in all fields');
        exit();
    }
    
    if ($password !== $confirm_password) {
        header('Location: ../register.php?error=Passwords do not match');
        exit();
    }
    
    if (strlen($password) < 6) {
        header('Location: ../register.php?error=Password must be at least 6 characters');
        exit();
    }
    
    try {
        $database = new Database();
        $db = $database->getConnection();
        
        // Check if email or student ID already exists
        $stmt = $db->prepare("SELECT id FROM users WHERE email = ? OR student_id = ?");
        $stmt->execute([$email, $student_id]);
        
        if ($stmt->fetch()) {
            header('Location: ../register.php?error=Email or Student ID already registered');
            exit();
        }
        
        // Create new user
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        
        $stmt = $db->prepare("INSERT INTO users (full_name, student_id, email, password, department, level) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$full_name, $student_id, $email, $hashed_password, $department, $level]);
        
        header('Location: ../index.php?success=Account created successfully! Please login.');
        exit();
        
    } catch(PDOException $e) {
        header('Location: ../register.php?error=Registration failed. Please try again.');
        exit();
    }
} else {
    header('Location: ../register.php');
    exit();
}
?>
