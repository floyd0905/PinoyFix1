<?php
// Database connection
$host = "localhost";
$user = "root"; // Replace with your MySQL username
$password = "1234"; // Replace with your MySQL password
$dbname = "useraccdb";

$conn = new mysqli($host, $user, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Read JSON input from the frontend
$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'];
$password = $data['password'];

// Query to check user credentials
$sql = "SELECT * FROM users WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password'])) {
        echo json_encode(["message" => "Login successful", "user" => $user]);
    } else {
        http_response_code(401);
        echo json_encode(["message" => "Incorrect password"]);
    }
} else {
    http_response_code(404);
    echo json_encode(["message" => "Email not found"]);
}

$conn->close();
?>
