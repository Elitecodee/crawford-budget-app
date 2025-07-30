<?php
session_start();
session_destroy();
header('Location: ../index.php?success=You have been logged out successfully');
exit();
?>
