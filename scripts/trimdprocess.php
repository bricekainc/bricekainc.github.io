<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['url'])) {
    $url = $_POST['url'];
    
    $ch = curl_init("{$config['site_url']}/api/url/add");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        "url" => $url,
        "domain" => ""
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer {$config['api_key']}",
        "Content-Type: application/json"
    ]);

    $response = curl_exec($ch);
    echo $response; // Return the exact JSON from the API to our AJAX script
}
