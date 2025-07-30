<?php
session_start();
require_once 'includes/auth_check.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crawford University Student Budget Tracker - Import Statements</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
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
            <h1 class="text-3xl font-bold text-gray-900">Import Bank Statements</h1>
            <p class="text-gray-600 mt-2">Upload your CSV or PDF bank statements to automatically import transactions</p>
        </div>

        <!-- Import Options -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <i class="fas fa-file-csv text-green-500 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">CSV Import</h3>
                </div>
                <p class="text-gray-600 mb-4">Upload CSV files from your bank or financial institution</p>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors" id="csvDropZone">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600 mb-2">Drag and drop your CSV file here, or</p>
                    <button class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700" onclick="document.getElementById('csvFileInput').click()">
                        Choose CSV File
                    </button>
                    <input type="file" id="csvFileInput" accept=".csv" class="hidden">
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center mb-4">
                    <i class="fas fa-file-pdf text-red-500 text-2xl mr-3"></i>
                    <h3 class="text-lg font-semibold">PDF Import</h3>
                </div>
                <p class="text-gray-600 mb-4">Upload PDF bank statements for automatic text extraction</p>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors" id="pdfDropZone">
                    <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                    <p class="text-gray-600 mb-2">Drag and drop your PDF file here, or</p>
                    <button class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" onclick="document.getElementById('pdfFileInput').click()">
                        Choose PDF File
                    </button>
                    <input type="file" id="pdfFileInput" accept=".pdf" class="hidden">
                </div>
            </div>
        </div>

        <!-- CSV Format Guide -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <h3 class="text-lg font-semibold mb-4">
                <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                Supported CSV Formats
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 class="font-medium mb-2">Standard Format:</h4>
                    <div class="bg-gray-100 p-3 rounded text-sm font-mono">
                        Date,Description,Amount<br>
                        2024-01-15,Grocery Store,-150.00<br>
                        2024-01-16,Salary Deposit,3000.00
                    </div>
                </div>
                <div>
                    <h4 class="font-medium mb-2">Extended Format:</h4>
                    <div class="bg-gray-100 p-3 rounded text-sm font-mono">
                        Date,Description,Amount,Category<br>
                        2024-01-15,Grocery Store,-150.00,Food<br>
                        2024-01-16,Salary,3000.00,Income
                    </div>
                </div>
            </div>
            <p class="text-sm text-gray-600 mt-4">
                <i class="fas fa-lightbulb text-yellow-500 mr-1"></i>
                Tip: Most Nigerian banks allow you to export transactions in CSV format from their online banking portal.
            </p>
        </div>

        <!-- Processing Status -->
        <div id="processingStatus" class="hidden bg-white rounded-lg shadow p-6 mb-8">
            <div class="flex items-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-4"></div>
                <div>
                    <h3 class="text-lg font-semibold">Processing File...</h3>
                    <p class="text-gray-600" id="processingMessage">Analyzing your bank statement</p>
                </div>
            </div>
            <div class="mt-4">
                <div class="bg-gray-200 rounded-full h-2">
                    <div id="progressBar" class="bg-green-600 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                </div>
            </div>
        </div>

        <!-- Preview and Mapping -->
        <div id="previewSection" class="hidden bg-white rounded-lg shadow p-6 mb-8">
            <h3 class="text-lg font-semibold mb-4">
                <i class="fas fa-eye text-green-500 mr-2"></i>
                Preview & Map Columns
            </h3>
            
            <!-- Column Mapping -->
            <div id="columnMapping" class="mb-6">
                <h4 class="font-medium mb-3">Map your CSV columns:</h4>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Date Column</label>
                        <select id="dateColumn" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                            <option value="">Select column...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Description Column</label>
                        <select id="descriptionColumn" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                            <option value="">Select column...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Amount Column</label>
                        <select id="amountColumn" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                            <option value="">Select column...</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Category Column (Optional)</label>
                        <select id="categoryColumn" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500">
                            <option value="">Select column...</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Data Preview -->
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr id="previewHeader">
                            <!-- Headers will be populated dynamically -->
                        </tr>
                    </thead>
                    <tbody id="previewBody" class="bg-white divide-y divide-gray-200">
                        <!-- Preview rows will be populated dynamically -->
                    </tbody>
                </table>
            </div>

            <div class="mt-6 flex justify-between items-center">
                <div class="text-sm text-gray-600">
                    <span id="previewCount">0</span> transactions found
                </div>
                <div class="space-x-3">
                    <button id="cancelImport" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                        Cancel
                    </button>
                    <button id="confirmImport" class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        Import Transactions
                    </button>
                </div>
            </div>
        </div>

        <!-- Import Results -->
        <div id="importResults" class="hidden bg-white rounded-lg shadow p-6">
            <div class="flex items-center mb-4">
                <i class="fas fa-check-circle text-green-500 text-2xl mr-3"></i>
                <h3 class="text-lg font-semibold">Import Complete!</h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600" id="importedCount">0</div>
                    <div class="text-sm text-gray-600">Imported</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600" id="duplicateCount">0</div>
                    <div class="text-sm text-gray-600">Duplicates Skipped</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600" id="errorCount">0</div>
                    <div class="text-sm text-gray-600">Errors</div>
                </div>
            </div>
            <div class="flex justify-center">
                <a href="dashboard.php" class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700">
                    View Dashboard
                </a>
            </div>
        </div>

        <!-- Nigerian Bank Templates -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">
                <i class="fas fa-university text-purple-500 mr-2"></i>
                Popular Nigerian Bank Templates
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button class="bank-template p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors" data-template="gtb">
                    <div class="font-medium">GTBank</div>
                    <div class="text-sm text-gray-600">Date, Description, Amount, Balance</div>
                </button>
                <button class="bank-template p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors" data-template="firstbank">
                    <div class="font-medium">First Bank</div>
                    <div class="text-sm text-gray-600">Date, Narration, Debit, Credit</div>
                </button>
                <button class="bank-template p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors" data-template="zenith">
                    <div class="font-medium">Zenith Bank</div>
                    <div class="text-sm text-gray-600">Date, Description, Amount</div>
                </button>
                <button class="bank-template p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors" data-template="uba">
                    <div class="font-medium">UBA</div>
                    <div class="text-sm text-gray-600">Date, Details, Amount, Balance</div>
                </button>
                <button class="bank-template p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors" data-template="access">
                    <div class="font-medium">Access Bank</div>
                    <div class="text-sm text-gray-600">Date, Transaction Details, Amount</div>
                </button>
                <button class="bank-template p-4 border border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors" data-template="fidelity">
                    <div class="font-medium">Fidelity Bank</div>
                    <div class="text-sm text-gray-600">Date, Narration, Debit, Credit</div>
                </button>
            </div>
        </div>
    </div>

    <script src="js/import-simple.js"></script>
</body>
</html>
