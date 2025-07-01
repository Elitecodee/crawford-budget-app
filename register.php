<?php
session_start();

// If user is logged in, redirect to dashboard
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crawford University Student Budget Tracker - Register</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-green-50 to-blue-100 min-h-screen">
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div class="text-center">
                <div class="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
                    <i class="fas fa-graduation-cap text-white text-2xl"></i>
                </div>
                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">Join Crawford University</h2>
                <h3 class="mt-2 text-xl font-bold text-green-600">Student Budget Tracker</h3>
                <p class="mt-2 text-sm text-gray-600">Create your student account</p>
            </div>
            
            <div class="bg-white rounded-lg shadow-xl p-8">
                <?php if (isset($_GET['error'])): ?>
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        <?php echo htmlspecialchars($_GET['error']); ?>
                    </div>
                <?php endif; ?>
                
                <form action="auth/register.php" method="POST" class="space-y-6">
                    <div>
                        <label for="full_name" class="block text-sm font-medium text-gray-700">Full Name</label>
                        <input id="full_name" name="full_name" type="text" required 
                               class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
                               placeholder="Enter your full name">
                    </div>
                    
                    <div>
                        <label for="student_id" class="block text-sm font-medium text-gray-700">Student ID</label>
                        <input id="student_id" name="student_id" type="text" required 
                               class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
                               placeholder="e.g., CU/2024/001">
                    </div>
                    
                    <div>
                        <label for="department" class="block text-sm font-medium text-gray-700">Department</label>
                        <select id="department" name="department" required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm">
                            <option value="">Select your department</option>
                            <option value="computer-science">Computer Science</option>
                            <option value="business-admin">Business Administration</option>
                            <option value="accounting">Accounting</option>
                            <option value="economics">Economics</option>
                            <option value="mass-comm">Mass Communication</option>
                            <option value="english">English Language</option>
                            <option value="political-science">Political Science</option>
                            <option value="sociology">Sociology</option>
                            <option value="psychology">Psychology</option>
                            <option value="biochemistry">Biochemistry</option>
                            <option value="microbiology">Microbiology</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="level" class="block text-sm font-medium text-gray-700">Current Level</label>
                        <select id="level" name="level" required 
                                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm">
                            <option value="">Select your level</option>
                            <option value="100">100 Level</option>
                            <option value="200">200 Level</option>
                            <option value="300">300 Level</option>
                            <option value="400">400 Level</option>
                            <option value="500">500 Level</option>
                        </select>
                    </div>
                    
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700">Student Email</label>
                        <input id="email" name="email" type="email" required 
                               class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
                               placeholder="your.email@student.crawford.edu.ng">
                    </div>
                    
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                        <input id="password" name="password" type="password" required 
                               class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
                               placeholder="Enter your password">
                    </div>
                    
                    <div>
                        <label for="confirm_password" class="block text-sm font-medium text-gray-700">Confirm Password</label>
                        <input id="confirm_password" name="confirm_password" type="password" required 
                               class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm" 
                               placeholder="Confirm your password">
                    </div>
                    
                    <div>
                        <button type="submit" class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out">
                            <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                                <i class="fas fa-user-plus text-green-500 group-hover:text-green-400"></i>
                            </span>
                            Create Student Account
                        </button>
                    </div>
                    
                    <div class="text-center">
                        <span class="text-sm text-gray-600">Already have an account? </span>
                        <a href="index.php" class="font-medium text-green-600 hover:text-green-500">Sign in</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
</body>
</html>
