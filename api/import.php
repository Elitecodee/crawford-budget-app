<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

require_once 'config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$database = new Database();
$db = $database->getConnection();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $authToken = $_POST['token'] ?? '';
    
    if (empty($authToken)) {
        echo json_encode(['success' => false, 'message' => 'Authentication required']);
        exit;
    }
    
    // Validate user token
    $stmt = $db->prepare("SELECT id FROM users WHERE session_token = ?");
    $stmt->execute([$authToken]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Invalid authentication']);
        exit;
    }
    
    $userId = $user['id'];
    
    if (isset($_FILES['file'])) {
        $file = $_FILES['file'];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            echo json_encode(['success' => false, 'message' => 'File upload error']);
            exit;
        }
        
        $fileType = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        
        if ($fileType === 'csv') {
            $result = processCSVFile($file['tmp_name'], $userId, $db);
        } elseif ($fileType === 'pdf') {
            $result = processPDFFile($file['tmp_name'], $userId, $db);
        } else {
            echo json_encode(['success' => false, 'message' => 'Unsupported file type']);
            exit;
        }
        
        echo json_encode($result);
    } else {
        echo json_encode(['success' => false, 'message' => 'No file uploaded']);
    }
}

function processCSVFile($filePath, $userId, $db) {
    try {
        $handle = fopen($filePath, 'r');
        if (!$handle) {
            throw new Exception('Cannot read CSV file');
        }
        
        $headers = fgetcsv($handle);
        $transactions = [];
        $imported = 0;
        $duplicates = 0;
        $errors = 0;
        
        while (($row = fgetcsv($handle)) !== FALSE) {
            try {
                // Basic CSV parsing - adjust based on your format
                $date = $row[0];
                $description = $row[1];
                $amount = floatval(str_replace(['$', ','], '', $row[2]));
                $category = isset($row[3]) ? $row[3] : 'other';
                
                // Validate date
                $dateObj = DateTime::createFromFormat('Y-m-d', $date);
                if (!$dateObj) {
                    $dateObj = DateTime::createFromFormat('m/d/Y', $date);
                }
                if (!$dateObj) {
                    throw new Exception('Invalid date format');
                }
                
                $formattedDate = $dateObj->format('Y-m-d');
                
                // Check for duplicates
                $stmt = $db->prepare("
                    SELECT COUNT(*) FROM (
                        SELECT date, description, amount FROM income WHERE user_id = ?
                        UNION ALL
                        SELECT date, description, amount FROM expenses WHERE user_id = ?
                    ) AS all_transactions 
                    WHERE date = ? AND description = ? AND ABS(amount - ?) < 0.01
                ");
                $stmt->execute([$userId, $userId, $formattedDate, $description, abs($amount)]);
                
                if ($stmt->fetchColumn() > 0) {
                    $duplicates++;
                    continue;
                }
                
                // Insert transaction
                if ($amount >= 0) {
                    $stmt = $db->prepare("INSERT INTO income (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$userId, $amount, $description, $category, $formattedDate]);
                } else {
                    $stmt = $db->prepare("INSERT INTO expenses (user_id, amount, description, category, date) VALUES (?, ?, ?, ?, ?)");
                    $stmt->execute([$userId, abs($amount), $description, $category, $formattedDate]);
                }
                
                $imported++;
                
            } catch (Exception $e) {
                $errors++;
                error_log("CSV import error: " . $e->getMessage());
            }
        }
        
        fclose($handle);
        
        return [
            'success' => true,
            'imported' => $imported,
            'duplicates' => $duplicates,
            'errors' => $errors
        ];
        
    } catch (Exception $e) {
        return [
            'success' => false,
            'message' => 'CSV processing failed: ' . $e->getMessage()
        ];
    }
}

function processPDFFile($filePath, $userId, $db) {
    // PDF processing would require additional libraries like TCPDF or similar
    // For now, return a placeholder response
    return [
        'success' => false,
        'message' => 'PDF processing not yet implemented on server side'
    ];
}
?>
